#!/bin/bash

echo "Testing streaming syllabus generation..."

curl -N -X POST http://localhost:3000/api/generate/syllabus \
  -H "Content-Type: application/json" \
  -d '{"content": "React is a JavaScript library for building user interfaces. Core concepts include Components, JSX, Props, State, and Hooks.", "stream": true}' \
  2>/dev/null

echo ""
echo "Stream test complete"
