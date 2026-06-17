import { app } from './app.js';
import { migrate } from './db/migrate.js';

const PORT = Number(process.env.PORT ?? 3000);

// Ensure the schema exists before serving requests.
migrate();

app.listen(PORT, () => {
  console.log(`BikeCare API listening on http://localhost:${PORT}`);
});
