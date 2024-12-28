import express from "express";
import session from "express-session";
import { compare, hash } from "bcrypt";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const app = express();
const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (app.get("env") === "production") {
	app.set("trust proxy", 1); // trust first proxy
	sess.cookie.secure = true; // serve secure cookies
}

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {},
	})
);

// Authentication Middleware
const requireAuth = (req, res, next) => {
	if (!req.session.userId) {
		return res.redirect("/login");
	}
	next();
};

// Login Routes
app.get("/login", (req, res) => {
	res.render("login");
});

// Create a register route as well
app.get("/register", (req, res) => {
	res.render("register");
});

app.post("/register", async (req, res) => {
	const { email, password } = req.body;
	console.log(email, password);
	try {
		const passwordHash = await hash(password, 10);
		await pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, passwordHash]);
		res.redirect("/login");
	} catch (err) {
		console.log(err);
		res.status(500).render("register", { error: "Server error" });
	}
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	try {
		const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
		const user = result.rows[0];

		if (user && (await compare(password, user.password_hash))) {
			req.session.userId = user.id;
			res.redirect("/");
		} else {
			res.render("login", { error: "Invalid credentials" });
		}
	} catch (err) {
		res.status(500).render("login", { error: "Server error" });
	}
});

app.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/login");
});

// Properties Routes
app.get("/", async (req, res) => {
	try {
		const properties = await pool.query("SELECT * FROM properties ORDER BY id ASC");
		if (req.session.userId) {
			const userId = req.session.userId;
			const interactions = await pool.query("SELECT * FROM user_interactions WHERE user_id = $1", [userId]);
			if (interactions.rows.length != 0) {
				const recommendations = await getSimilarPropertyRecommendations(userId, 5);
				res.render("properties", {
					properties: properties.rows,
					recommendations: recommendations.map((r) => r.property),
					loggedIn: true,
				});
			} else {
				res.render("properties", { properties: properties.rows, recommendations: [], loggedIn: true });
			}
		} else res.render("properties", { properties: properties.rows, recommendations: [], loggedIn: false });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Failed to fetch properties" });
	}
});

app.get("/properties/:id", async (req, res) => {
	const id = parseInt(req.params.id);
	const property = await pool.query("SELECT * FROM properties where id = $1", [id]);

	if (!property.rows[0]) {
		return res.status(404).render("error", { message: "Property not found" });
	}

	res.render("property", { property: property.rows[0], loggedIn: !!req.session.userId });

	// Save user interaction
	if (req.session.userId) {
		try {
			const userId = req.session.userId;
			const interactionType = "view";
			await pool.query(
				"INSERT INTO user_interactions (user_id, property_id, interaction_type) VALUES ($1, $2, $3)",
				[userId, id, interactionType]
			);
		} catch (err) {
			console.log(err);
		}
	}
});

// Function to calculate the similarity score between two properties
function calculateSimilarity(property1, property2) {
	// Calculate the Euclidean distance between the properties
	const distance = Math.sqrt(
		Math.pow(property1.bedrooms - property2.bedrooms, 2) +
			Math.pow(property1.bathrooms - property2.bathrooms, 2) +
			Math.pow(property1.area - property2.area, 2) +
			Math.pow(property1.zipcode - property2.zipcode, 2)
	);

	// Return the inverse of the distance as the similarity score
	return 1 / (1 + distance);
}

// Function to get similar property recommendations
async function getSimilarPropertyRecommendations(userId, k) {
	try {
		// Get the user's past interactions
		const userInteractions = await pool.query(
			"SELECT property_id, COUNT(*) as count FROM user_interactions WHERE user_id = $1 GROUP BY property_id ORDER BY count DESC",
			[userId]
		);
		if (userInteractions.rows.length === 0) {
			return [];
		}
		const propertyIds = userInteractions.rows.map((interaction) => interaction.property_id);

		// Get the details of the user's top properties
		const topProperties = propertyIds.slice(0, k);
		const userProperties = await pool.query("SELECT * FROM properties WHERE id = ANY ($1)", [topProperties]);

		// Get all properties except the user's top properties
		const allProperties = await pool.query("SELECT * FROM properties WHERE id != ALL ($1)", [topProperties]);

		// Calculate the similarity score between the user's top properties and all other properties
		const recommendations = allProperties.rows.map((property) => {
			const similarityScores = userProperties.rows.map((userProperty) => {
				return {
					propertyId: userProperty.id,
					similarity: calculateSimilarity(property, userProperty),
				};
			});
			console.log(similarityScores)

			// Sort the similarity scores in descending order
			similarityScores.sort((a, b) => b.similarity - a.similarity);

			// Calculate the weighted average of the top k similarity scores
			let weightedSum = 0;
			let totalWeight = 0;
			k = Math.min(k, similarityScores.length);
			for (let i = 0; i < k; i++) {
				const similarity = similarityScores[i].similarity;
				const weight = similarity > 0 ? 1 / similarity : 0;
				weightedSum += weight * similarityScores[i].propertyId;
				totalWeight += weight;
			}

			// Calculate the final recommendation score
			const recommendationScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

			return {
				property: property,
				score: recommendationScore,
			};
		});

		// Sort the recommendations in descending order of the recommendation score
		recommendations.sort((a, b) => b.score - a.score);

		// Return the top k recommendations
		return recommendations.slice(0, k);
	} catch (err) {
		console.log(err);
		return [];
	}
}

// Example usage:
app.get("/recommendations", async (req, res) => {
	try {
		const userId = req.session.userId;
		const recommendations = await getSimilarPropertyRecommendations(userId, 5);
		res.render("recommendations", { recommendations: recommendations });
	} catch (err) {
		res.status(500).render("error", { message: err.message });
	}
});

app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});
