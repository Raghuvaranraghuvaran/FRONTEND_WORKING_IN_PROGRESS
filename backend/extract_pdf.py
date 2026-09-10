from pypdf import PdfReader
import sys, os

files = [
    "Implementation_Plan_Fraud_Detection_Complete_App_Architecture.pdf",
    "Return Guard — Risk Checkpoints.pdf",
    "ReturnGuard_Modified.pdf",
    "backend RG.pdf"
]

out = []
for f in files:
    out.append("="*60)
    out.append(f"FILE: {f}")
    out.append("="*60)
    if not os.path.exists(f):
        out.append("File not found")
        continue
    try:
        reader = PdfReader(f)
        out.append(f"Total pages: {len(reader.pages)}")
        for i, page in enumerate(reader.pages):
            txt = page.extract_text() or ""
            out.append(f"\n--- Page {i+1} ---")
            lines = [line.strip() for line in txt.splitlines() if line.strip()]
            out.extend(lines)
    except Exception as e:
        out.append(f"Error reading {f}: {e}")

with open("pdf_summary.txt", "w", encoding="utf-8") as fp:
    fp.write("\n".join(out))

print(f"Extracted {len(out)} lines to pdf_summary.txt")
