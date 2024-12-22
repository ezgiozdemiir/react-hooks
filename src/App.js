import React, {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useDebugValue,
  useDeferredValue,
  useId,
  useInsertionEffect,
  useTransition,
  useOptimistic,
} from "react";
import './App.css';

// Context of Theme
const ThemeContext = React.createContext();

function useTaskLogger(tasks) {
  useDebugValue(tasks, (tasks) =>
    tasks.length > 0 ? `${tasks.length} tasks` : "No tasks"
  );
  return tasks;
}

// Reducer function for task state
function taskReducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, { id: Date.now(), text: action.text, completed: false }];
    case "toggle":
      return state.map((task) =>
        task.id === action.id ? { ...task, completed: !task.completed } : task
      );
    case "filter":
      return action.payload;
    default:
      return state;
  }
}

// Child component for imperatively handling input focus
const TaskInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
  }));

  return <input ref={inputRef} type="text" placeholder="Enter a task" />;
});

function App() {
  // useState
  // newTask - tracks the current value of the input box for new tasks.
  // searchTerm - tracks the value of the search input for filtering tasks.
  const [newTask, setNewTask] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // useReducer
  // Manages more complex state logic with a reducer function.
  const [tasks, dispatch] = useReducer(taskReducer, []);

  // useContext
  // Shares theme --> light across components without prop drilling.
  const theme = useContext(ThemeContext);

  // useRef
  const inputRef = useRef();

  // useEffect
  // Logs to the console when the "tasks" state is updated.
  useEffect(() => {
    console.log("Tasks updated:", tasks);
  }, [tasks]);

  // useMemo
  // Calculates completed tasks when "tasks" change.
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks]
  );

  // useCallback
  // Memorizes the function to add a new task to "prevent unnecessary rerender" when dependencies (newTask) don’t change.
  const addTask = useCallback(() => {
    if (newTask.trim()) {
      dispatch({ type: "add", text: newTask });
      setNewTask("");
    }
  }, [newTask]);

  // useLayoutEffect
  // Executes synchronously after all DOM changes, before the browser repaints.
  useLayoutEffect(() => {
    if (tasks.length > 0) {
      console.log("Latest task:", tasks[tasks.length - 1].text);
    }
  }, [tasks]);

  // useInsertionEffect
  // Executes before any DOM changes are made, typically for inserting CSS or styles.
  useInsertionEffect(() => {
    console.log("CSS rules or styles could be inserted with this.");
  }, []);

  // useId
  // Generates an "unique id" for the search input (filterId) to link the input with its label.
  const filterId = useId();

  // useDeferredValue
  // Creates a deferred version of a state, useful for prioritizing urgent updates while deferring non-urgent ones.
  // Defers the searchTerm value for task filtering, preventing delay during rapid input changes.
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        task.text.toLowerCase().includes(deferredSearchTerm.toLowerCase())
      ),
    [deferredSearchTerm, tasks]
  );

  // useTransition --> Rendering while ui updates.
  // Filters tasks while showing "Updating list..." during transitions.
  const [isPending, startTransition] = useTransition();
  const handleSearch = (e) => {
    const value = e.target.value;
    startTransition(() => setSearchTerm(value));
  };

  // useOptimistic
  //  Provides optimistic updates to the ui before confirming changes with a backend.
  // Adds an optimistic task to the task list immediately when the "Add Optimistic Task" button is clicked.
  const [optimisticTasks, setOptimisticTasks] = useOptimistic([], (state, action) => {
    switch (action.type) {
      case 'add':
        return [...state, action.task];
      default:
        return state;
    }
  });

  const addOptimisticTask = () => {
    const newTask = { id: Date.now(), text: 'Optimistic Task', completed: false };
    console.log('Adding task:', newTask);
    startTransition(() => {
      setOptimisticTasks((currentTasks) => {
        return [...currentTasks, newTask];
      });
    });
  };

  // useDebugValue (via custom hook)
  // A custom hook useTaskLogger uses useDebugValue to display the number of tasks.
  useTaskLogger(tasks);

  return (
    <ThemeContext.Provider value="light">
      <div className="App">
        <h2>React Hooks Task Manager</h2>
        <TaskInput ref={inputRef} />
        <button onClick={() => inputRef.current.focus()}>Focus Input</button>
        <div style={{ marginTop: "20px" }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a task"
          />
          <button onClick={addTask}>Add Task</button>
          <button onClick={addOptimisticTask}>Add Optimistic Task</button>
          <h2>Optimistic Tasks</h2>
          <ul>
            {optimisticTasks.map((task) => (
              <li key={task.id}>{task.text}</li>
            ))}
          </ul>
      {isPending && <p>Updating task list...</p>}          
        </div>
        <h2>Filter Tasks</h2>
        <label htmlFor={filterId}>Search: </label>
        <input
          id={filterId}
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search tasks"
        />
        {isPending && <p>Updating list...</p>}
        <h2>Tasks</h2>
        <ul>
          {filteredTasks.map((task) => (
            <li key={task.id} style={{ textDecoration: task.completed ? "line-through" : "none" }}>
              {task.text}
              <button onClick={() => dispatch({ type: "toggle", id: task.id })}>
                Toggle
              </button>
            </li>
          ))}
        </ul>
        <h2>Completed Tasks</h2>
        <ul>
          {completedTasks.map((task) => (
            <li key={task.id}>{task.text}</li>
          ))}
        </ul>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
