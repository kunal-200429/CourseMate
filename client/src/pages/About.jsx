import { Link } from 'react-router-dom';

function About() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">ABOUT COURSEMATE</p>
          <h1>
            Work smarter.
            <br />
            Submit on time.
          </h1>
          <p className="subtitle">
            CourseMate is a student assignment management application
            built to organise coursework and track deadlines.
          </p>
        </div>
        <div className="hero-icon" aria-hidden="true">
          🎓
        </div>
      </section>

      <section className="panel">
        <h2>Project features</h2>
        <ul>
          <li>Create, edit and delete assignments.</li>
          <li>Track pending and completed assignments.</li>
          <li>Monitor overdue deadlines.</li>
          <li>Search assignments and filter by status or priority.</li>
          <li>Store and manage assignment data using MongoDB.</li>
          <li>Connect the React frontend to a Node.js and Express REST API.</li>
        </ul>

        <h2>Technology stack</h2>
        <p><strong>Frontend:</strong> React and React Router</p>
        <p><strong>Backend:</strong> Node.js and Express.js</p>
        <p><strong>Database:</strong> MongoDB</p>

        <Link to="/" className="primary-btn">
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}

export default About;