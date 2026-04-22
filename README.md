# AI Learning Graph

Interactive knowledge graph for navigating AI/ML engineering concepts.

## Setup

```bash
cd ai_learning_graph
pip install fastapi uvicorn
uvicorn app:app --reload
```

Open http://localhost:8000

## Features

- Force-directed graph of 105 concepts across 10 learning paths
- Click any node to open a detail panel (definition, explanation, code example)
- Search bar with live fuzzy filtering
- Sidebar path filter highlights a learning path in the graph
- Prev/Next navigation follows path order
- Clickable prerequisite and related concept chips

## Regenerate concepts.json

```bash
python generate_concepts.py
```

## File structure

```
app.py               FastAPI server
concepts.json        All 105 concepts
generate_concepts.py Source-of-truth for concept content
static/
  index.html         Full frontend
  style.css          Styles
  graph.js           D3 force-directed graph
  search.js          Search/filter logic
```
