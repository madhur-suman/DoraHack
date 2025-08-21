import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import api from '../utils/api';

function Chat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await api.post('/api/chat/query/', {
        query: query.trim()
      });
      
      setResponse(result.data.response);
    } catch (error) {
      setError(error.response?.data?.error || 'Error processing your question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Chat with Your Data</h1>
      
      <Card className="mb-4">
        <Card.Header>
          <h5>Ask questions about your receipts and spending patterns</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            Examples: "What's my total spending this month?", "Which store do I shop at most?", 
            "What's my average item price?", "Show me my recent purchases"
          </p>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ask a question about your receipt data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Button disabled={loading} type="submit" variant="primary">
              {loading ? 'Processing...' : 'Ask Question'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      
      {response && (
        <Card>
          <Card.Header>Response</Card.Header>
          <Card.Body>
            <div className="bg-light p-3 rounded">
              {response.split('\n').map((line, index) => (
                <p key={index} className="mb-1">{line}</p>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Chat;



