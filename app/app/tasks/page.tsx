"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const { data: session } = useSession();
  const user = session?.user;
  const client = useSupabaseBrowserClient();

  // This `useEffect` will wait for the User object to be loaded before requesting
  // the tasks for the signed in user
  useEffect(() => {
    if (!user) return;

    async function loadTasks() {
      setLoading(true);
      const { data, error } = await client.from("tasks").select();
      if (!error) setTasks(data ?? []);
      setLoading(false);
    }

    loadTasks();
  }, [user, client]);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Insert task into the "tasks" database
    await client.from("tasks").insert({
      name,
    });
    window.location.reload();
  }

  return (
    <div>
      <h1>Tasks</h1>

      {loading && <p>Loading...</p>}

      {!loading &&
        tasks.length > 0 &&
        tasks.map((task: any) => <p key={task.id}>{task.name}</p>)}

      {!loading && tasks.length === 0 && <p>No tasks found</p>}

      <form onSubmit={createTask}>
        <input
          autoFocus
          type="text"
          name="name"
          placeholder="Enter new task"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
