import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                team: resolve(__dirname, 'team.html'),
                cases: resolve(__dirname, 'cases.html'),
                game: resolve(__dirname, 'game.html'),
                register: resolve(__dirname, 'register.html'),
                contacts: resolve(__dirname, 'contacts.html'),
                doctor: resolve(__dirname, 'doctor.html') // Додано doctor.html, тепер він білдиться!
            },
        },
    },
});