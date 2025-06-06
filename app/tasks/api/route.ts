import { NextResponse } from 'next/server';

// In-memory task store for demo purposes
let tasks: any[] = [];

export async function GET() {
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newTask = { ...data, id: Date.now() };
  tasks.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const idx = tasks.findIndex((t) => t.id === data.id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...data };
    return NextResponse.json(tasks[idx]);
  }
  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  tasks = tasks.filter((t) => t.id !== id);
  return NextResponse.json({ success: true });
} 