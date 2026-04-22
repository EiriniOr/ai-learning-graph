import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).parent
app = FastAPI()

with open(BASE / "concepts.json") as f:
    DATA = json.load(f)

# Build lookup by id
CONCEPT_MAP = {c["id"]: c for c in DATA["concepts"]}


@app.get("/api/concepts")
def get_concepts():
    return DATA


@app.get("/api/concepts/{concept_id}")
def get_concept(concept_id: str):
    c = CONCEPT_MAP.get(concept_id)
    if not c:
        raise HTTPException(404, f"Concept '{concept_id}' not found")
    return c


@app.get("/api/search")
def search(q: str = ""):
    q = q.lower().strip()
    if not q:
        return DATA["concepts"]
    results = []
    for c in DATA["concepts"]:
        score = 0
        if q in c["id"]:
            score += 3
        if q in c["title"].lower():
            score += 3
        if any(q in t for t in c["tags"]):
            score += 2
        if q in c["short"].lower():
            score += 1
        if q in c["body"].lower():
            score += 1
        if score:
            results.append((score, c))
    results.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in results]


app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE / "static" / "index.html")
