// This array will hold the expenses data in memory.
// NOTE: For a real application, you would use a database (like MongoDB, PostgreSQL, etc.)
// as this in-memory data will be lost when the function "sleeps" or a new instance is created.
const expenses = [];

/**
 * Helper function to validate required fields for a new expense.
 * @param {object} body - The request body containing expense data.
 * @returns {string|null} - An error message string if validation fails, otherwise null.
 */
function validateExpense(body) {
  const requiredFields = ['amount', 'description', 'category', 'date'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: '${field}'`;
    }
  }

  // Basic type and value validation
  if (typeof body.amount !== 'number' || body.amount <= 0) {
      return 'Amount must be a positive number.';
  }

  // You might add more validation for date format, category values, etc. here

  return null;
}

/**
 * Main handler function for the serverless endpoint /api/expenses.
 * @param {import('http').IncomingMessage} req - The incoming request object.
 * @param {import('http').ServerResponse} res - The server response object.
 */
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // --- GET: Retrieve all expenses ---
      try {
        // Set the response status and content type
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          success: true,
          count: expenses.length,
          data: expenses,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
      break;

    case 'POST':
      // --- POST: Add a new expense ---
      try {
        let body;
        // Parse the request body (assuming it's JSON)
        try {
          // Read the body data stream
          const buffers = [];
          for await (const chunk of req) {
              buffers.push(chunk);
          }
          const data = Buffer.concat(buffers).toString();
          body = data ? JSON.parse(data) : {};
        } catch (parseError) {
          return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
        }
        
        // Validate the incoming data
        const validationError = validateExpense(body);
        if (validationError) {
          return res.status(400).json({ success: false, error: validationError });
        }

        // Create a new expense object with a simple ID and timestamp
        const newExpense = {
          id: Date.now(), // Simple, non-collision-safe ID for this example
          amount: body.amount,
          description: body.description,
          category: body.category,
          date: body.date,
          createdAt: new Date().toISOString(),
        };

        // Add the new expense to the in-memory array
        expenses.push(newExpense);

        // Respond with the newly created expense
        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({
          success: true,
          data: newExpense,
        });

      } catch (error) {
        console.error('POST Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
      break;

    default:
      // --- All other methods (PUT, DELETE, etc.) ---
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
      break;
  }
}
