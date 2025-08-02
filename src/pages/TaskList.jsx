import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

export function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get('/api/tasks')
      .then(response => setTasks(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="form-wrapper">
      <h1 className="heading-primary">Tasks</h1>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <Link to={`/task/${task.id}`}>{task.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
