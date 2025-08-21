import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, insightsResponse] = await Promise.all([
        axios.get('/api/receipts/statistics/'),
        axios.get('/api/chat/insights/')
      ]);
      
      setStats(statsResponse.data);
      setInsights(insightsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Items</Card.Title>
              <Card.Text className="h2">{stats?.total_items || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Spent</Card.Title>
              <Card.Text className="h2">${stats?.total_spent || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Avg Item Price</Card.Title>
              <Card.Text className="h2">${stats?.avg_item_price || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Receipts</Card.Title>
              <Card.Text className="h2">{stats?.total_receipts || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/upload" variant="primary">
                  Upload New Receipt
                </Button>
                <Button as={Link} to="/receipts" variant="outline-primary">
                  View All Receipts
                </Button>
                <Button as={Link} to="/chat" variant="outline-primary">
                  Ask Questions
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Quick Insights</Card.Header>
            <Card.Body>
              {insights ? (
                <div>
                  <p><strong>This Month:</strong> ${insights.this_month_spending}</p>
                  <p><strong>Top Category:</strong> {insights.top_category || 'None'}</p>
                  <p><strong>Top Store:</strong> {insights.top_store || 'None'}</p>
                </div>
              ) : (
                <p>No data available for insights</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;



