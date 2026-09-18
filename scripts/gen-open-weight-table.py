"""Regenerate src/data/open-weight-table.ts: the prompt tokens each open-weight
model's official tokenizer and chat template produce for three fixed prompts.

Dev only, never shipped (package.json publishes dist). Run from the repo root:

    uv run --with transformers --with jinja2 --with tiktoken --with blobfile \
        --with sentencepiece --with protobuf python scripts/gen-open-weight-table.py

Changing a prompt invalidates every row: regenerate the whole table.
"""

import json
import sys
from pathlib import Path

from transformers import AutoTokenizer

SHORT = "Reply with exactly: ok"
MIXED = (
    "Reference text:\n"
    "The quick brown fox jumps over the lazy dog while 42 engineers benchmark "
    "tokenizers at 3.14159 GHz on 2026-09-19T00:00:00Z.\n"
    "中文：北京时间凌晨一点，工程师们正在比较不同模型的分词器，结果令人惊讶。\n"
    "日本語：東京の研究者は、トークナイザーの違いを静かに測定している。\n"
    "Русский: Инженеры сравнивают токенизаторы разных моделей.\n"
    "Deutsch: Größenänderungen über Straßenbahnhaltestellen erfordern Äußerungen.\n"
    "Español: ¿Dónde está la biblioteca? ¡Increíble acción!\n"
    "Code: def fib(n: int) -> int: return n if n < 2 else fib(n - 1) + fib(n - 2)\n"
    'JSON: {"id": 918273645, "tags": ["alpha", "beta"], "ok": true, "ratio": 0.00042}\n'
    "URL: https://example.org/path/to/resource?query=tokenizer&lang=zh-CN#section-7\n"
    "Emoji: 🚀🔥✨🧠 Symbols: ∑∫√∞≈≠ Numbers: 1234567890 9876543210 3.14e-10 "
    "0xDEADBEEF 1,000,000.00\n"
)
LONG = f"{SHORT}\n\n{MIXED}"
SYSTEM = "You are a terse assistant."

# Published model id (lowercase, as resellers list it) to the official repo.
MODELS = {
    "deepseek-v3.1": "deepseek-ai/DeepSeek-V3.1",
    "deepseek-v3.1-terminus": "deepseek-ai/DeepSeek-V3.1-Terminus",
    "deepseek-v3.2": "deepseek-ai/DeepSeek-V3.2",
    "deepseek-v4-flash": "deepseek-ai/DeepSeek-V4-Flash",
    "deepseek-v4-flash-0731": "deepseek-ai/DeepSeek-V4-Flash-0731",
    "deepseek-v4-pro": "deepseek-ai/DeepSeek-V4-Pro",
    "glm-4.5": "zai-org/GLM-4.5",
    "glm-4.5-air": "zai-org/GLM-4.5-Air",
    "glm-4.6": "zai-org/GLM-4.6",
    "glm-4.7": "zai-org/GLM-4.7",
    "glm-5.2": "zai-org/GLM-5.2",
    "glm-5.3": "zai-org/GLM-5.3",
    "glm-5.3-flash": "zai-org/GLM-5.3-Flash",
    "mistral-large-3": "mistralai/Mistral-Large-3-675B-Instruct-2512",
    "minimax-m2": "MiniMaxAI/MiniMax-M2",
    "minimax-m2.1": "MiniMaxAI/MiniMax-M2.1",
    "minimax-m2.5": "MiniMaxAI/MiniMax-M2.5",
    "minimax-m2.7": "MiniMaxAI/MiniMax-M2.7",
    "minimax-m3": "MiniMaxAI/MiniMax-M3",
    "mimo-v2-flash": "XiaomiMiMo/MiMo-V2-Flash",
    "mimo-v2.5": "XiaomiMiMo/MiMo-V2.5",
    "mimo-v2.5-pro": "XiaomiMiMo/MiMo-V2.5-Pro",
    "qwen3-235b-a22b-instruct-2507": "Qwen/Qwen3-235B-A22B-Instruct-2507",
    "qwen3.8-27b": "Qwen/Qwen3.8-27B",
    "kimi-k2-instruct-0905": "moonshotai/Kimi-K2-Instruct-0905",
    "kimi-k2.5": "moonshotai/Kimi-K2.5",
    "kimi-k2.6": "moonshotai/Kimi-K2.6",
    "kimi-k2.7-code": "moonshotai/Kimi-K2.7-Code",
    "kimi-k3": "moonshotai/Kimi-K3",
    "hy4-preview": "tencent/Hy4-preview",
    "gpt-oss-120b": "openai/gpt-oss-120b",
}

FAMILY_BY_PREFIX = {
    "deepseek": "deepseek",
    "glm": "zhipu",
    "mistral": "mistral",
    "minimax": "minimax",
    "mimo": "xiaomi",
    "qwen": "qwen",
    "kimi": "moonshot",
    "hy": "tencent",
    "gpt-oss": "openai",
}

# Only these orgs ship tokenizer code that must run to load at all.
REMOTE_CODE_ORGS = {"moonshotai"}

# Template switches providers flip; a variable a template never reads is inert.
VARIANTS = [
    {},
    {"enable_thinking": False},
    {"enable_thinking": True},
    {"thinking": False},
    {"thinking": True},
    {"reasoning_effort": "low"},
    {"reasoning_effort": "high"},
]


def family_of(key: str) -> str:
    for prefix, family in FAMILY_BY_PREFIX.items():
        if key.startswith(prefix):
            return family
    raise SystemExit(f"no family for {key}")


def count(tok, messages, kwargs) -> int:
    out = tok.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=True, **kwargs
    )
    ids = out["input_ids"] if hasattr(out, "keys") else out
    if ids and isinstance(ids[0], list):
        ids = ids[0]
    return len(ids)


def measure(key: str, repo: str) -> dict | None:
    org = repo.split("/")[0]
    try:
        tok = AutoTokenizer.from_pretrained(
            repo, trust_remote_code=org in REMOTE_CODE_ORGS
        )
    except Exception as exc:
        print(f"skip {key}: tokenizer did not load ({exc})", file=sys.stderr)
        return None
    short, system, delta = set(), set(), set()
    for kwargs in VARIANTS:
        try:
            s = count(tok, [{"role": "user", "content": SHORT}], kwargs)
            l = count(tok, [{"role": "user", "content": LONG}], kwargs)
            y = count(
                tok,
                [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": SHORT},
                ],
                kwargs,
            )
        except Exception as exc:
            print(f"{key} {kwargs}: {exc}", file=sys.stderr)
            continue
        short.add(s)
        system.add(y)
        delta.add(l - s)
    if not short:
        print(f"skip {key}: no chat template rendered", file=sys.stderr)
        return None
    return {
        "family": family_of(key),
        "repo": repo,
        "short": sorted(short),
        "system": sorted(system),
        "delta": sorted(delta),
    }


def main() -> None:
    rows = {}
    for key, repo in MODELS.items():
        row = measure(key, repo)
        if row:
            rows[key] = row
            print(f"{key:32} {row['family']:9} short={row['short']} system={row['system']} delta={row['delta']}")
    out = Path(__file__).resolve().parent.parent / "src" / "data" / "open-weight-table.ts"
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "// Generated by scripts/gen-open-weight-table.py from each model's official",
        "// tokenizer and chat template. Regenerate, never edit by hand.",
        "",
        f"export const TEMPLATE_SHORT_PROMPT = {json.dumps(SHORT, ensure_ascii=False)};",
        f"export const TEMPLATE_LONG_PROMPT = {json.dumps(LONG, ensure_ascii=False)};",
        f"export const TEMPLATE_SYSTEM_PROMPT = {json.dumps(SYSTEM, ensure_ascii=False)};",
        "",
        "export type OpenWeightSignature = {",
        "  family: string;",
        "  repo: string;",
        "  /** Prompt tokens for the short prompt, one per chat template variant. */",
        "  short: readonly number[];",
        "  /** The short prompt behind a system message of our own. */",
        "  system: readonly number[];",
        "  /** Long minus short: the tokenizer alone, whatever the template adds. */",
        "  delta: readonly number[];",
        "};",
        "",
        "export const OPEN_WEIGHT_TABLE: Readonly<Record<string, OpenWeightSignature>> = {",
    ]
    for key, row in rows.items():
        lines.append(
            f"  {json.dumps(key)}: {{ family: {json.dumps(row['family'])}, repo: {json.dumps(row['repo'])}, "
            f"short: {json.dumps(row['short'])}, system: {json.dumps(row['system'])}, delta: {json.dumps(row['delta'])} }},"
        )
    lines.append("};")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()
