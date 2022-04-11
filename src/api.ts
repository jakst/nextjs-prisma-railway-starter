import useSWR, { mutate } from "swr";
import { type Todo } from "./types";

const todoPath = "/api/todos";
const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());

export const useTodos = () => useSWR<Todo[]>(todoPath, fetcher);

export const createTodo = async (text: string) => {
  await mutate(
    todoPath,
    async (todos: Todo[]) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newTodo = await fetch(todoPath, {
        method: "POST",
        body: JSON.stringify({ text }),
      }).then((res) => res.json());

      return todos.map((todo) => {
        if (todo.id === "new-todo") return newTodo;
        return todo;
      });
    },
    {
      optimisticData: (todos: Todo[]) => [
        { text, completed: false, id: "new-todo" },
        ...todos,
      ],
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    },
  );
};

export const toggleTodo = async (todo: Todo) => {
  const completed = !todo.completed;

  await mutate(
    todoPath,
    async (todos: Todo[]) => {
      await fetch(`${todoPath}?todoId=${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed }),
      });

      return todos;
    },
    {
      optimisticData: (todos: Todo[]) =>
        todos.map((t) => (t.id === todo.id ? { ...todo, completed } : t)),
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    },
  );
};

export const deleteTodo = async (id: string) => {
  await mutate(
    todoPath,
    fetch(`${todoPath}?todoId=${id}`, { method: "DELETE" }),
    {
      optimisticData: (todos: Todo[]) => todos.filter((t) => t.id !== id),
    },
  );
};
