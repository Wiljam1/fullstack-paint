const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const mysql = require('mysql2');
const cors = require('cors');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'wiljamniklas',
  database: 'images',
});

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const processedImageBuffer = await processImage(req.file.buffer);
    await saveImageToDatabase(processedImageBuffer);
    res.json({ message: 'Image uploaded and processed successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/images', async (req, res) => {
  const query = 'SELECT * FROM images.image_data';

  try {
    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error fetching images from the database:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        const images = rows.map(row => ({ data: row.data.toString('base64') }));
        res.setHeader('Content-Type', 'application/json');
        res.json(images);
      }
    });
  } catch (error) {
    console.error('Error fetching images from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/images/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM images.image_data WHERE id = ?';  // Assuming your ID column is named 'id'

  try {
      connection.query(query, [id], (err, rows) => {
          if (err) {
              console.error('Error fetching image from the database:', err);
              if (!res.headersSent) {
                  res.status(500).json({ error: 'Internal server error' });
              }
          } else {
              if (rows.length === 0) {
                  res.status(404).json({ error: 'Image not found' });
              } else {
                  const image = { data: rows[0].data.toString('base64') };
                  res.setHeader('Content-Type', 'application/json');
                  res.json(image);
              }
          }
      });
  } catch (error) {
      console.error('Error fetching image from the database:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

async function processImage(buffer) {
  const processedImageBuffer = await sharp(buffer)
    .resize(300, 300)
    .toBuffer();
  return processedImageBuffer;
}

// Create the 'image_data' table if it doesn't exist
async function createTableIfNotExists() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS image_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data MEDIUMBLOB
    )
  `;
  await connection.execute(createTableQuery);
}

// Save image data to the database
async function saveImageToDatabase(imageBuffer) {
  try {
    // Create the table if it doesn't exist
    await createTableIfNotExists();

    // Insert the image data into the 'image_data' table
    const insertQuery = 'INSERT INTO image_data (data) VALUES (?)';
    await connection.execute(insertQuery, [imageBuffer]);

    console.log('Image data saved to the database');
  } catch (error) {
    console.error('Error saving image data to the database:', error);
    throw error; // Rethrow the error for higher-level handling
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});