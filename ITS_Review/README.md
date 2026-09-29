# Networking & InfoSec Fundamentals — Practice Exam

A static, no-backend practice exam covering networking and cybersecurity fundamentals for the Certiport **IT Specialist – Cybersecurity** exam: topologies, OSI model, TCP/IP model, CIDR & IP addressing, firewalls, and load balancers (plus protocols/ports, devices, wireless, attacks/CIA triad, VPN, and segmentation).

Every attempt randomly draws **50 questions** from a bank of 130+ (see `questions.js`), shuffles both question order and answer-choice order, then scores the attempt with a per-topic breakdown and inline explanations. Nothing is stored or sent anywhere — it's a static site, so it's free to host and safe to share.

## Files

- `index.html` — page structure
- `style.css` — styling (light/dark aware)
- `questions.js` — the question bank
- `app.js` — exam logic (randomization, scoring, rendering)
- `render.yaml` — Render.com Blueprint config for one-click static deployment

## Run it locally

No build step or dependencies — just serve the folder with any static file server. For example, with Node installed:

```bash
npx serve .
```

Or with Python:

```bash
python -m http.server 8000
```

Then open the printed local URL in a browser.

## Deploy to Render.com

This repo is set up to deploy as a **Static Site** on Render with zero configuration.

1. Push this folder to a GitHub (or GitLab) repository.
2. In the [Render dashboard](https://dashboard.render.com), click **New +** → **Static Site**.
3. Connect the repository.
4. Render will detect `render.yaml` and pre-fill the settings:
   - **Build Command:** *(none)*
   - **Publish Directory:** `.`
5. Click **Create Static Site**. Render will give you a shareable `https://<your-app>.onrender.com` URL.

Every subsequent push to the connected branch redeploys automatically.

## Adding more questions

Add new objects to the `QUESTION_BANK` array in `questions.js` using the same shape:

```js
{
  domain: "Firewalls",
  text: "Question text?",
  options: ["Choice A", "Choice B", "Choice C", "Choice D"],
  correct: 0, // index of the correct option
  explain: "One or two sentences on why the correct answer is correct."
}
```

The exam automatically picks up new questions on the next attempt — no other code changes needed.
