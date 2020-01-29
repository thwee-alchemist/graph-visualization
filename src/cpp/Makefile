# webassembly
CC=em++
CFLAGS=-std=c++11 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s SAFE_HEAP=1 -s ASSERTIONS=1 -s ENVIRONMENT="worker" -s DISABLE_EXCEPTION_CATCHING=2 -O3
DEPS=-I eigen 
LINK=-s LINKABLE=1 
UNUSED=-O0 -g4

Settings.o: Settings.cpp Settings.h
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c Settings.cpp -o build/Settings.o

wasm: Settings.h Settings.cpp Vertex.h Vertex.cpp Edge.h Edge.cpp BarnesHutNode3.h BarnesHutNode3.cpp LayoutGraph.h LayoutGraph.cpp DynamicMatching.h
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c Settings.cpp -o build/Settings.o
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c Vertex.cpp -o build/Vertex.o
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c Edge.cpp -o build/Edge.o
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c BarnesHutNode3.cpp -o build/BarnesHutNode3.o 
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c LayoutGraph.cpp -o build/LayoutGraph.o
	$(CC) $(CFLAGS) $(DEPS) $(LINK) -c DynamicMatching.cpp -o build/DynamicMatching.o
	$(CC) $(CFLAGS) $(DEPS) build/Settings.o build/Vertex.o build/Edge.o build/BarnesHutNode3.o build/DynamicMatching.o build/LayoutGraph.o core.cpp --bind -o build/core.js
	cp build/core.* ../js/.
	cp build/core.* ../../dist/.
	cp build/core.* ../../docs/.