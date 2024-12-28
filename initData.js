import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
});


const properties = [
	{
		id: 1,
		bedrooms: 4,
		bathrooms: 4,
		area: 4053,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 869500,
	},
	{
		id: 2,
		bedrooms: 4,
		bathrooms: 3,
		area: 3343,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 865200,
	},
	{
		id: 3,
		bedrooms: 3,
		bathrooms: 4,
		area: 3923,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 889000,
	},
	{
		id: 4,
		bedrooms: 5,
		bathrooms: 5,
		area: 4022,
		zipcode: 85262,
		location: "Scottsdale, Arizona",
		price: 910000,
	},
	{
		id: 5,
		bedrooms: 3,
		bathrooms: 4,
		area: 4116,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 971226,
	},
	{
		id: 6,
		bedrooms: 4,
		bathrooms: 5,
		area: 4581,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 1249000,
	},
	{
		id: 7,
		bedrooms: 3,
		bathrooms: 4,
		area: 2544,
		zipcode: 85262,
		location: "Scottsdale, Arizona",
		price: 799000,
	},
	{
		id: 8,
		bedrooms: 4,
		bathrooms: 5,
		area: 5524,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 1698000,
	},
	{
		id: 9,
		bedrooms: 3,
		bathrooms: 4,
		area: 4229,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 1749000,
	},
	{
		id: 10,
		bedrooms: 4,
		bathrooms: 5,
		area: 3550,
		zipcode: 85262,
		location: "Scottsdale, Arizona",
		price: 1500000,
	},
	{
		id: 11,
		bedrooms: 5,
		bathrooms: 5,
		area: 4829,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 519200,
	},
	{
		id: 12,
		bedrooms: 4,
		bathrooms: 4,
		area: 3428,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 1039000,
	},
	{
		id: 13,
		bedrooms: 5,
		bathrooms: 3,
		area: 5462,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 799000,
	},
	{
		id: 14,
		bedrooms: 4,
		bathrooms: 4,
		area: 4021,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 889000,
	},
	{
		id: 15,
		bedrooms: 5,
		bathrooms: 5,
		area: 4406,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 700000,
	},
	{
		id: 16,
		bedrooms: 4,
		bathrooms: 4,
		area: 3721,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 500000,
	},
	{
		id: 17,
		bedrooms: 5,
		bathrooms: 3,
		area: 3710,
		zipcode: 85331,
		location: "Cave Creek, Arizona",
		price: 740000,
	},
	{
		id: 18,
		bedrooms: 3,
		bathrooms: 4,
		area: 2748,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 725000,
	},
	{
		id: 19,
		bedrooms: 5,
		bathrooms: 4,
		area: 4190,
		zipcode: 85255,
		location: "Scottsdale, Arizona",
		price: 1199000,
	},
	{
		id: 20,
		bedrooms: 3,
		bathrooms: 3.5,
		area: 4143,
		zipcode: 85266,
		location: "Scottsdale, Arizona",
		price: 925000,
	},
];

properties.map((property) => {
	let id = property.id
	property.images = [`${id}_frontal.jpg`, `${id}_bedroom.jpg`, `${id}_bathroom.jpg`, `${id}_kitchen.jpg`]
});

async function insertProperties() {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		for (const property of properties) {
			const { id, bedrooms, bathrooms, area, zipcode, location, price, images } = property;
			const query = 'INSERT INTO properties (id, bedrooms, bathrooms, area, zipcode, location, price, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
			const values = [id, bedrooms, bathrooms, area, zipcode, location, price, images];
			await client.query(query, values);
		}
		await client.query('COMMIT');
		console.log('Properties inserted successfully');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error inserting properties:', error);
	} finally {
		client.release();
	}
}

insertProperties();