import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

export function TaskDetails() {
  const [task, setTask] = useState({});
  const { id } = useParams();

  useEffect(() => {
    axios.get(`/api/task/${id}`)
      .then(response => setTask(response.data))
      .catch(error => console.error(error));
  }, [id]);

  return (
    <div className="form-wrapper">
      <h1 className="heading-primary">{task.name}</h1>
      <p>{task.description}</p>
    </div>
  );
}