# Contexto: Neonorte API (Central Source of Truth)
**Propósito:** Este é o Backend Node.js do ecossistema Hub & Spoke. Fornece os DTOs e APIs para o Hub, ERP, Academy, Lumi e Extranets.
**Setup:** Express.js + Prisma ORM (MySQL). Deploy via Fly.io.
**Segurança:** Autenticação unificada JWT e Single Sign-On Server. Possui RLS (Row Level Security) simulado no Prisma em Multi-Tenant para isolar dados de inquilinos.
**CORS:** Rígido, aceitando origens pré-determinadas nas Variáveis de Ambiente.
