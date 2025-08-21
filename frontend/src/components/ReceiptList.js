import React, { useState, useEffect } from 'react';
import { Table, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import api from '../utils/api';

function ReceiptList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/api/receipts/');
      setReceipts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading receipts...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">My Receipts</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <InputGroup>
            <Form.Control
              placeholder="Search by item name, store, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {filteredReceipts.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <p>No receipts found. <a href="/upload">Upload your first receipt!</a></p>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Store</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>{receipt.item_name}</td>
                <td>
                  {receipt.store_name ? (
                    <Badge bg="secondary">{receipt.store_name}</Badge>
                  ) : (
                    <span className="text-muted">Unknown</span>
                  )}
                </td>
                <td>
                  {receipt.category ? (
                    <Badge bg="info">{receipt.category}</Badge>
                  ) : (
                    <span className="text-muted">General</span>
                  )}
                </td>
                <td>{receipt.quantity}</td>
                <td>${receipt.price}</td>
                <td><strong>${receipt.total_amount}</strong></td>
                <td>{new Date(receipt.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default ReceiptList;




