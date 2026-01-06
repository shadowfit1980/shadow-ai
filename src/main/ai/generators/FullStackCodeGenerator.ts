/**
 * Full-Stack Code Generator
 * 
 * Generate code for CRUD operations, APIs, components,
 * and boilerplate for all supported frameworks.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface EntityDefinition {
    name: string;
    fields: Array<{
        name: string;
        type: string;
        required?: boolean;
        unique?: boolean;
        relation?: { model: string; type: 'one' | 'many' };
    }>;
}

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    handler: string;
    auth?: boolean;
    validation?: Record<string, string>;
}

export type FrameworkTarget =
    | 'express' | 'fastify' | 'nestjs'
    | 'django' | 'fastapi' | 'flask'
    | 'laravel' | 'spring' | 'dotnet' | 'go-gin'
    | 'react' | 'vue' | 'angular' | 'svelte';

// ============================================================================
// CODE GENERATOR
// ============================================================================

export class FullStackCodeGenerator extends EventEmitter {
    private static instance: FullStackCodeGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FullStackCodeGenerator {
        if (!FullStackCodeGenerator.instance) {
            FullStackCodeGenerator.instance = new FullStackCodeGenerator();
        }
        return FullStackCodeGenerator.instance;
    }

    // ========================================================================
    // CRUD GENERATORS
    // ========================================================================

    /**
     * Generate CRUD API for entity
     */
    generateCRUD(entity: EntityDefinition, framework: FrameworkTarget): string {
        switch (framework) {
            case 'express':
                return this.generateExpressCRUD(entity);
            case 'fastapi':
                return this.generateFastAPICRUD(entity);
            case 'django':
                return this.generateDjangoCRUD(entity);
            case 'laravel':
                return this.generateLaravelCRUD(entity);
            case 'spring':
                return this.generateSpringCRUD(entity);
            case 'dotnet':
                return this.generateDotNetCRUD(entity);
            case 'go-gin':
                return this.generateGoCRUD(entity);
            default:
                return this.generateExpressCRUD(entity);
        }
    }

    private generateExpressCRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all ${name}s
router.get('/${lower}s', async (req, res) => {
  try {
    const items = await prisma.${lower}.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ${lower}s' });
  }
});

// Get ${name} by ID
router.get('/${lower}s/:id', async (req, res) => {
  try {
    const item = await prisma.${lower}.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item) return res.status(404).json({ error: '${name} not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ${lower}' });
  }
});

// Create ${name}
router.post('/${lower}s', async (req, res) => {
  try {
    const item = await prisma.${lower}.create({
      data: req.body,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create ${lower}' });
  }
});

// Update ${name}
router.put('/${lower}s/:id', async (req, res) => {
  try {
    const item = await prisma.${lower}.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update ${lower}' });
  }
});

// Delete ${name}
router.delete('/${lower}s/:id', async (req, res) => {
  try {
    await prisma.${lower}.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete ${lower}' });
  }
});

export default router;
`;
    }

    private generateFastAPICRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .database import get_db

router = APIRouter(prefix="/${lower}s", tags=["${name}s"])

@router.get("/", response_model=List[schemas.${name}])
def get_${lower}s(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.${name}).offset(skip).limit(limit).all()

@router.get("/{${lower}_id}", response_model=schemas.${name})
def get_${lower}(${lower}_id: int, db: Session = Depends(get_db)):
    item = db.query(models.${name}).filter(models.${name}.id == ${lower}_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="${name} not found")
    return item

@router.post("/", response_model=schemas.${name})
def create_${lower}(${lower}: schemas.${name}Create, db: Session = Depends(get_db)):
    db_item = models.${name}(**${lower}.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{${lower}_id}", response_model=schemas.${name})
def update_${lower}(${lower}_id: int, ${lower}: schemas.${name}Update, db: Session = Depends(get_db)):
    db_item = db.query(models.${name}).filter(models.${name}.id == ${lower}_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="${name} not found")
    for key, value in ${lower}.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{${lower}_id}")
def delete_${lower}(${lower}_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.${name}).filter(models.${name}.id == ${lower}_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="${name} not found")
    db.delete(db_item)
    db.commit()
    return {"message": "${name} deleted"}
`;
    }

    private generateDjangoCRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import ${name}
from .serializers import ${name}Serializer

class ${name}ViewSet(viewsets.ModelViewSet):
    queryset = ${name}.objects.all()
    serializer_class = ${name}Serializer
    
    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        try:
            instance = ${name}.objects.get(pk=pk)
            serializer = self.serializer_class(instance)
            return Response(serializer.data)
        except ${name}.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
    
    def update(self, request, pk=None):
        try:
            instance = ${name}.objects.get(pk=pk)
            serializer = self.serializer_class(instance, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ${name}.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, pk=None):
        try:
            instance = ${name}.objects.get(pk=pk)
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ${name}.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
`;
    }

    private generateLaravelCRUD(entity: EntityDefinition): string {
        const name = entity.name;

        return `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${name};
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class ${name}Controller extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(${name}::all());
    }

    public function show(int $id): JsonResponse
    {
        $item = ${name}::find($id);
        if (!$item) {
            return response()->json(['error' => '${name} not found'], 404);
        }
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $item = ${name}::create($request->all());
        return response()->json($item, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = ${name}::find($id);
        if (!$item) {
            return response()->json(['error' => '${name} not found'], 404);
        }
        $item->update($request->all());
        return response()->json($item);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = ${name}::find($id);
        if (!$item) {
            return response()->json(['error' => '${name} not found'], 404);
        }
        $item->delete();
        return response()->json(null, 204);
    }
}
`;
    }

    private generateSpringCRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `package com.example.demo.controller;

import com.example.demo.model.${name};
import com.example.demo.repository.${name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${lower}s")
public class ${name}Controller {

    @Autowired
    private ${name}Repository repository;

    @GetMapping
    public List<${name}> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${name}> getById(@PathVariable Long id) {
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${name} create(@RequestBody ${name} item) {
        return repository.save(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${name}> update(@PathVariable Long id, @RequestBody ${name} item) {
        return repository.findById(id)
            .map(existing -> {
                item.setId(id);
                return ResponseEntity.ok(repository.save(item));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
`;
    }

    private generateDotNetCRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Controllers;

[ApiController]
[Route("api/${lower}s")]
public class ${name}Controller : ControllerBase
{
    private readonly AppDbContext _context;

    public ${name}Controller(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<${name}>>> GetAll()
    {
        return await _context.${name}s.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<${name}>> GetById(int id)
    {
        var item = await _context.${name}s.FindAsync(id);
        if (item == null) return NotFound();
        return item;
    }

    [HttpPost]
    public async Task<ActionResult<${name}>> Create(${name} item)
    {
        _context.${name}s.Add(item);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ${name} item)
    {
        if (id != item.Id) return BadRequest();
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.${name}s.FindAsync(id);
        if (item == null) return NotFound();
        _context.${name}s.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
`;
    }

    private generateGoCRUD(entity: EntityDefinition): string {
        const name = entity.name;
        const lower = name.toLowerCase();

        return `package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type ${name}Handler struct {
    DB *gorm.DB
}

func (h *${name}Handler) GetAll(c *gin.Context) {
    var items []${name}
    h.DB.Find(&items)
    c.JSON(http.StatusOK, items)
}

func (h *${name}Handler) GetByID(c *gin.Context) {
    id, _ := strconv.Atoi(c.Param("id"))
    var item ${name}
    if err := h.DB.First(&item, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "${name} not found"})
        return
    }
    c.JSON(http.StatusOK, item)
}

func (h *${name}Handler) Create(c *gin.Context) {
    var item ${name}
    if err := c.ShouldBindJSON(&item); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    h.DB.Create(&item)
    c.JSON(http.StatusCreated, item)
}

func (h *${name}Handler) Update(c *gin.Context) {
    id, _ := strconv.Atoi(c.Param("id"))
    var item ${name}
    if err := h.DB.First(&item, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "${name} not found"})
        return
    }
    if err := c.ShouldBindJSON(&item); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    h.DB.Save(&item)
    c.JSON(http.StatusOK, item)
}

func (h *${name}Handler) Delete(c *gin.Context) {
    id, _ := strconv.Atoi(c.Param("id"))
    if err := h.DB.Delete(&${name}{}, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "${name} not found"})
        return
    }
    c.Status(http.StatusNoContent)
}
`;
    }

    // ========================================================================
    // COMPONENT GENERATORS
    // ========================================================================

    /**
     * Generate React component
     */
    generateReactComponent(name: string, props: string[] = []): string {
        const propsInterface = props.length > 0
            ? `interface ${name}Props {\n${props.map(p => `  ${p}: string;`).join('\n')}\n}\n\n`
            : '';
        const propsType = props.length > 0 ? `${name}Props` : '';
        const propsDestructure = props.length > 0 ? `{ ${props.join(', ')} }` : '';

        return `${propsInterface}export function ${name}(${propsType ? `${propsDestructure}: ${propsType}` : ''}) {
  return (
    <div className="${name.toLowerCase()}">
      <h2>${name}</h2>
      ${props.map(p => `<p>{${p}}</p>`).join('\n      ')}
    </div>
  );
}
`;
    }

    /**
     * Generate Vue component
     */
    generateVueComponent(name: string, props: string[] = []): string {
        return `<script setup lang="ts">
${props.length > 0 ? `defineProps<{\n${props.map(p => `  ${p}: string`).join('\n')}\n}>()` : ''}
</script>

<template>
  <div class="${name.toLowerCase()}">
    <h2>${name}</h2>
    ${props.map(p => `<p>{{ ${p} }}</p>`).join('\n    ')}
  </div>
</template>

<style scoped>
.${name.toLowerCase()} {
  padding: 1rem;
}
</style>
`;
    }

    /**
     * Generate Flutter widget
     */
    generateFlutterWidget(name: string, props: string[] = []): string {
        return `import 'package:flutter/material.dart';

class ${name} extends StatelessWidget {
${props.map(p => `  final String ${p};`).join('\n')}

  const ${name}({
    super.key,
${props.map(p => `    required this.${p},`).join('\n')}
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${name}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
${props.map(p => `          Text(${p}),`).join('\n')}
        ],
      ),
    );
  }
}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Save generated code to file
     */
    async saveToFile(code: string, filePath: string): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, code);
        this.emit('file:saved', { path: filePath });
    }

    /**
     * Generate multiple CRUD controllers
     */
    async generateAllCRUD(entities: EntityDefinition[], framework: FrameworkTarget, outputDir: string): Promise<string[]> {
        const files: string[] = [];

        for (const entity of entities) {
            const code = this.generateCRUD(entity, framework);
            const ext = this.getExtension(framework);
            const filePath = path.join(outputDir, `${entity.name.toLowerCase()}.${ext}`);
            await this.saveToFile(code, filePath);
            files.push(filePath);
        }

        return files;
    }

    private getExtension(framework: FrameworkTarget): string {
        const extensions: Record<string, string> = {
            express: 'ts',
            fastify: 'ts',
            nestjs: 'ts',
            django: 'py',
            fastapi: 'py',
            flask: 'py',
            laravel: 'php',
            spring: 'java',
            dotnet: 'cs',
            'go-gin': 'go',
            react: 'tsx',
            vue: 'vue',
            angular: 'ts',
            svelte: 'svelte',
        };
        return extensions[framework] || 'ts';
    }
}

// Export singleton
export const fullStackCodeGenerator = FullStackCodeGenerator.getInstance();
