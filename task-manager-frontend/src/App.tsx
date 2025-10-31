import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// Update this URL to match your backend port
// If using port 5001: 'http://localhost:5001/api/tasks'
// If using port 5000: 'http://localhost:5000/api/tasks'
const API_URL = "http://localhost:5001/api/tasks"; // Changed to 5001 to avoid conflict

interface Task {
  id: number;
  description: string;
  isCompleted: boolean;
}

type FilterType = "All" | "Active" | "Completed";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      fetchTasks();
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Task[]>(API_URL);
      setTasks(response.data);
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskDescription.trim()) {
      setError("Task description cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<Task>(API_URL, {
        description: newTaskDescription,
      });
      setTasks([...tasks, response.data]);
      setNewTaskDescription("");
    } catch (err) {
      setError("Failed to add task");
      console.error("Error adding task:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, isCompleted: !task.isCompleted };

    try {
      await axios.put(`${API_URL}/${id}`, updatedTask);
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      setError("Failed to update task");
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      setError("Failed to delete task");
      console.error("Error deleting task:", err);
    }
  };

  const getFilteredTasks = (): Task[] => {
    switch (filter) {
      case "Active":
        return tasks.filter((t) => !t.isCompleted);
      case "Completed":
        return tasks.filter((t) => t.isCompleted);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="app-container">
      <div className="task-manager">
        <h1>Task Manager</h1>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="add-task-section">
          <input
            type="text"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTask()}
            placeholder="Enter task description..."
            className="task-input"
            disabled={loading}
          />
          <button
            onClick={addTask}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
        </div>

        <div className="filter-section">
          <button
            className={`filter-btn ${filter === "All" ? "active" : ""}`}
            onClick={() => setFilter("All")}
          >
            All ({tasks.length})
          </button>
          <button
            className={`filter-btn ${filter === "Active" ? "active" : ""}`}
            onClick={() => setFilter("Active")}
          >
            Active ({tasks.filter((t) => !t.isCompleted).length})
          </button>
          <button
            className={`filter-btn ${filter === "Completed" ? "active" : ""}`}
            onClick={() => setFilter("Completed")}
          >
            Completed ({tasks.filter((t) => t.isCompleted).length})
          </button>
        </div>

        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <p className="no-tasks">No tasks to display</p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-item ${task.isCompleted ? "completed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTaskCompletion(task.id)}
                  className="task-checkbox"
                />
                <span className="task-description">{task.description}</span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="btn btn-delete"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="task-stats">
          <p>{tasks.filter((t) => !t.isCompleted).length} task(s) remaining</p>
        </div>
      </div>
    </div>
  );
}

export default App;
