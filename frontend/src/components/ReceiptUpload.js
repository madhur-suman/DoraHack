import React, { useState } from 'react';
import { Form, Button, Card, Alert, Table } from 'react-bootstrap';
import api from '../utils/api';

function ReceiptUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ocrResult, setOcrResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
    setOcrResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/ocr/process/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOcrResult(response.data);
      setSuccess('Receipt processed successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Error processing receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItems = async () => {
    if (!ocrResult?.structured_data?.items) {
      setError('No items to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const items = ocrResult.structured_data.items;
      const receiptData = ocrResult.structured_data;

      for (const item of items) {
        await api.post('/api/receipts/', {
          receipt_id: receiptData.store_name + '_' + Date.now(),
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          category: 'General',
          store_name: receiptData.store_name,
          purchase_date: receiptData.purchase_date || new Date().toISOString().split('T')[0]
        });
      }

      setSuccess('Items saved successfully!');
      setOcrResult(null);
      setFile(null);
    } catch (error) {
      setError('Error saving items: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Upload Receipt</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select Receipt Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </Form.Group>
            <Button disabled={loading} type="submit" variant="primary">
              {loading ? 'Processing...' : 'Process Receipt'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {ocrResult && (
        <Card>
          <Card.Header>Processing Results</Card.Header>
          <Card.Body>
            <h5>Extracted Text:</h5>
            <pre className="bg-light p-3 rounded">{ocrResult.ocr_text}</pre>
            
            <h5 className="mt-4">Structured Data:</h5>
            <div className="mb-3">
              <strong>Store:</strong> {ocrResult.structured_data.store_name}<br/>
              <strong>Total Amount:</strong> ${ocrResult.structured_data.total_amount}<br/>
              <strong>Purchase Date:</strong> {ocrResult.structured_data.purchase_date}
            </div>

            {ocrResult.structured_data.items && ocrResult.structured_data.items.length > 0 && (
              <>
                <h5>Items Found:</h5>
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrResult.structured_data.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                <Button 
                  onClick={handleSaveItems} 
                  variant="success" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Items to Database'}
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default ReceiptUpload;




