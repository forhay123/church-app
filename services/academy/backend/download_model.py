from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "valhalla/t5-small-qg-hl"

print("Downloading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_name)

print("Downloading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

print("Download complete and cached locally.")
