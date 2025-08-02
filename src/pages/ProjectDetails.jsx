import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

export function ProjectDetails() {
  const [project, setProject] = useState({});
  const { id } = useParams();

  useEffect(() => {
    axios.get(`/api/project/${id}`)
      .then(response => setProject(response.data))
      .catch(error => console.error(error));
  }, [id]);

  return (
    <div className="form-wrapper">
      <h1 className="heading-primary">{project.name}</h1>
      <p>{project.description}</p>
    </div>
  );
}