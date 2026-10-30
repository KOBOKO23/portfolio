/**
 * Emergency offline fallback for the blog.
 *
 * Snapshotted 2026-07-29 while the backend was reachable, for use only when
 * the live API is unreachable (e.g. during the AWS account lockout) — so a
 * shared article link doesn't land visitors on a dead page. This is meant to
 * be temporary: once the backend is back, live data takes over automatically
 * since these are only used as a fetch-failure fallback, never preferred
 * over a real response.
 *
 * Remove this file (and its two call sites in Blog.tsx / BlogDetail.tsx)
 * once the backend has been reliably up for a while — it's a snapshot, not
 * a data source to maintain.
 */

const CONTENT_HTML = `<p>Be honest. Somewhere in your head, a weather forecaster is a person standing by a window, squinting at the sky, and going, "Hmm, those clouds look angry. I'd say... 70% chance of rain." Then they walk into a studio, point at a green screen, and get paid for vibes.</p>
<p>I need you to sit down for this: that is not how it works. Not even a little.</p>
<p>Here's the question that breaks the whole myth wide open — how many meteorologists do you think are standing outside, in every town, in every forest, on every stretch of ocean, staring at the sky right now? Zero. There is no meteorologist stationed on top of your neighbor's mango tree. There's no one hovering over the middle of the Indian Ocean with binoculars. So if forecasting were just "look up and guess," most of the planet would simply never get a forecast. And yet, somehow, you know it might rain in Kisumu on Thursday. How?</p>
<p>Let's actually go there.</p>
<p>Once Upon a Time: Forecasting by Vibes (Sort Of)</p>
<p>Weather forecasting didn't start with satellites or supercomputers. It started with something almost embarrassingly simple: persistence forecasting. The logic? Today's weather is probably tomorrow's weather too. Rained today? Probably rains tomorrow. Sunny today? Stay sunny, my friend.</p>
<p>Laugh if you want, but this actually works reasonably well sometimes — specifically when the upper-level wind flow (what we now call "omega flow," basically how air is moving several kilometers above your head) is calm and unchanging. The problem is, the people using persistence forecasting centuries ago had no idea omega flow even existed. They weren't choosing to rely on stable upper-level winds — they just got lucky when the atmosphere happened to cooperate, and got it spectacularly wrong when it didn't. Persistence forecasting wasn't science yet. It was educated hope.</p>
<p>Then came synoptic analysis, and this is where things start looking like actual meteorology. Forecasters began mapping fronts, air masses, pressure systems — tracking how a cold, dry air mass barreling in from one direction would collide with a warm, humid one from another, and using that collision to say something smarter than "probably the same as today." Suddenly, weather wasn't just persistence — it was a story of air masses with personalities, temperatures, and grudges against each other.</p>
<p>Still, all of this was fundamentally reactive. You were reading the board after the pieces had already moved. What forecasters really wanted was to see the next move before it happened.</p>
<p>Enter the Equations: Numerical Weather Prediction</p>
<p>Here's the plot twist that changed everything: the atmosphere, chaotic as it looks, is not lawless. It obeys physics. Air pressure, temperature, moisture, wind — all of it moves according to mathematical relationships we can actually write down. If you know the state of the atmosphere right now, and you know the equations that govern how it changes, you can step forward in time, mathematically, and estimate what it'll look like in six hours. Then twelve. Then a hundred and twenty.</p>
<p>This is Numerical Weather Prediction (NWP), and it is, without exaggeration, one of the great quiet triumphs of applied science. It only became possible once we had the computing power to solve millions of these equations fast enough to be useful (there's no point predicting today's weather... next week). So really, modern forecasting isn't meteorology bolted onto technology — it is technology, wearing a meteorologist's coat.</p>
<p>Okay. Deep breath. Now let's talk about what actually happens before a forecaster releases that number you see on your phone.</p>
<p>So What Does a Forecaster Actually Do All Day?</p>
<p>Step 1: They investigate yesterday like a detective at a crime scene.</p>
<p>Before saying anything about tomorrow, a forecaster looks backward. What did the weather actually do in the last 24 hours? What did the observations say — from weather stations, satellites, AMDAR sensors on commercial aircraft (yes, the plane you flew on last month was quietly feeding weather data the whole time), automatic weather stations, ships, balloons, the works? And critically: did our last forecast get it right? If it rained when we said it wouldn't, why? You cannot trust today's forecast if you haven't interrogated yesterday's mistakes.</p>
<p>Step 2: They check where things stand right now.</p>
<p>Next, they pull up the current state of the atmosphere — from multiple models — and lay it next to real satellite imagery, like checking a suspect's alibi against actual security footage. Does the model's version of "now" match reality? If the model already thinks it's sunny somewhere it's actually pouring, that's a red flag for everything the model says about later.</p>
<p>Step 3: Only then do they look ahead — the prognosis.</p>
<p>Now, and only now, do they let the models run forward — 24 hours, sometimes out to seven days — to see where the atmosphere is heading.</p>
<p>Notice what just happened. Before predicting the future, a forecaster audits the past and verifies the present. It's less "gaze into a crystal ball" and more "double-check your GPS before trusting it to route you through the mountains."</p>
<p>The Global Machine Behind It All</p>
<p>Here's where it gets properly impressive. This whole process is powered by some genuinely enormous meteorological institutions — ECMWF (Europe), Météo-France, NOAA in the US, and others — each running global weather models that simulate the entire state of planet Earth's atmosphere at fixed time steps.</p>
<p>To do that, they need a starting point, called the initial conditions — basically, "here is precisely what the atmosphere looks like right now, everywhere." Building that snapshot means blending model output with millions of real observations pouring in from ground stations, ships, balloons, satellites, and aircraft, all at once, all the time. This blending process has a name: data assimilation, or simply "analysis." It's less a single measurement and more the world's most elaborate group project, except everyone actually submits their part on time.</p>
<p>Now, here's a question worth sitting with: if these global models already simulate the whole Earth, why do smaller countries bother running their own regional models?</p>
<p>Because global models have a resolution wall. Picture the Earth's atmosphere carved into a grid — global models might use grid boxes tens of kilometers wide. Anything happening inside one of those boxes — like a small, violent convective thunderstorm popping up over a single county — is basically invisible to the global model; it's too small to see at that resolution. For developing countries especially, the fix is to take the global model's output and downscale it into a regional model with a much finer grid, sharp enough to actually catch those localized convective storms the global view blurs right past. Same physics, tighter lens.</p>
<p>The Forecaster as Judge, Jury, and Referee</p>
<p>Here's a fact that might surprise you: there isn't just one model. There's ECMWF's IFS, the American GFS, the German ICON, France's ARPEGE, and several others — all simultaneously simulating the same atmosphere, and all occasionally disagreeing with each other like siblings arguing over what actually happened at dinner.</p>
<p>The forecaster's job is to sit in the middle of that argument and figure out who's most believable, using actual atmospheric evidence: mean sea level pressure (MSLP), CAPE (a measure of how much energy is available for storms), humidity at different heights, and wind — both how it moves horizontally and vertically.</p>
<p>Here's a taste of the logic: if you see surface convergence (air piling inward near the ground) paired with upper-air divergence (air spreading out high above), plus enough CAPE for fuel, plus humidity pushing past 70%... you've basically got a recipe for rain. It's less "I have a feeling" and more "these four independent lines of evidence all point the same direction."</p>
<p>The AI Plot Twist</p>
<p>And now, the part that's genuinely reshaping the field: artificial intelligence and machine learning. Rather than replacing the physics-based models, AI is increasingly used to post-process their output — cleaning up known biases, sharpening details, and squeezing meaningfully more accuracy out of the same raw data.</p>
<p>There's also a deeper shift happening in how forecasts are even framed. Weather isn't a single, certain outcome — it's a spread of possibilities. That's why forecasters run ensemble forecasting: instead of running one model once, they run it dozens of times with tiny, realistic tweaks to the starting conditions (because we can never measure the entire atmosphere with perfect precision anyway). If 39 out of 50 of those runs show rain over Kisumu, that's where your "70% chance of rain" actually comes from. It's not a guess dressed up as a percentage — it's a genuine vote count from dozens of simulated parallel futures.</p>
<p>So the Next Time Someone Says "They Just Guess"...</p>
<p>...you now have the receipts. A forecast is the end product of history's slow crawl from persistence to synoptic analysis to physics-based simulation; a global network of stations, satellites, and aircraft feeding real-time data into supercomputers; regional models sharpening the picture where it matters most; a human forecaster cross-examining several competing models like a detective who trusts no one single witness; and, increasingly, AI quietly polishing the whole thing at the edges.</p>
<p>All that — just so someone can decide whether to carry an umbrella. Wild, right?</p>
<p>So next time it doesn't rain when it was forecast to, maybe cut your local meteorologist a little slack. They weren't guessing. Somewhere, 11 out of 50 ensemble members were quietly plotting against them the whole time.</p>`;

export const FALLBACK_LIST_ARTICLES = [
  {
    id: 1,
    title: "The Lie We've All Been Told About Weather Forecasts",
    slug: 'the-lie-weve-all-been-told-about-weather-forecasts',
    excerpt:
      "Ever wondered how forecasters predict rain without a meteorologist standing on every rooftop? From guessing games with clouds to supercomputers running the physics of the atmosphere, here's the real (and surprisingly funny) story behind your daily forecast.",
    thumbnail:
      'https://koboko-portfolio-media-332ac5.s3.eu-west-1.amazonaws.com/media/blog/thumbnails/met.jpeg',
    category: {
      id: 1,
      name: 'Meteorology',
      slug: 'meteorology',
      icon: '',
      color: '#0ea5e9',
      article_count: 1,
    },
    tags: [
      'weather forecasting',
      'meteorology',
      'science explained',
      'climate science',
      'AI in weather',
      'ensemble forecasting',
      'ECMWF',
    ],
    author: 'Philip Koboko',
    language: 'en',
    read_time: 5,
    views: 12,
    like_count: 0,
    comment_count: 0,
    is_featured: true,
    published_date: '2026-07-28T23:20:25.083328+03:00',
  },
];

export const FALLBACK_DETAIL_ARTICLES: Record<
  string,
  {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail: string | null;
    thumbnail_alt: string;
    category: { name: string; slug: string; color: string } | null;
    tags: string[];
    author: string;
    author_bio: string;
    language: string;
    read_time: number;
    views: number;
    like_count: number;
    comment_count: number;
    is_featured: boolean;
    published_date: string;
    content: string;
    content_html: string;
    allow_comments: boolean;
    reaction_summary: Record<string, number>;
    share_counts: Record<string, number>;
    user_liked: boolean;
    user_reaction: string | null;
    updated_at: string;
    gallery: { id: number; image: string; alt_text: string; caption: string; order: number }[];
  }
> = {
  'the-lie-weve-all-been-told-about-weather-forecasts': {
    id: 1,
    title: "The Lie We've All Been Told About Weather Forecasts",
    slug: 'the-lie-weve-all-been-told-about-weather-forecasts',
    excerpt:
      "Ever wondered how forecasters predict rain without a meteorologist standing on every rooftop? From guessing games with clouds to supercomputers running the physics of the atmosphere, here's the real (and surprisingly funny) story behind your daily forecast.",
    thumbnail:
      'https://koboko-portfolio-media-332ac5.s3.eu-west-1.amazonaws.com/media/blog/thumbnails/met.jpeg',
    thumbnail_alt: 'Met Office',
    category: { name: 'Meteorology', slug: 'meteorology', color: '#0ea5e9' },
    tags: [
      'weather forecasting',
      'meteorology',
      'science explained',
      'climate science',
      'AI in weather',
      'ensemble forecasting',
      'ECMWF',
    ],
    author: 'Philip Koboko',
    author_bio:
      'Phil is a meteorologist who spends his days untangling model runs, satellite loops, and ensemble spreads so the rest of us just know whether to grab an umbrella. He writes about the science behind the forecast — chaos theory, supercomputers, and all — in plain, occasionally ridiculous English.',
    language: 'en',
    read_time: 5,
    views: 12,
    like_count: 0,
    comment_count: 0,
    is_featured: true,
    published_date: '2026-07-28T23:20:25.083328+03:00',
    content: CONTENT_HTML,
    content_html: CONTENT_HTML,
    allow_comments: true,
    reaction_summary: { love: 1, fire: 0, clap: 0, mind_blown: 0, insightful: 0 },
    share_counts: { linkedin: 1, copy_link: 1 },
    user_liked: false,
    user_reaction: null,
    updated_at: '2026-07-29T00:30:54.812686+03:00',
    gallery: [
      {
        id: 3,
        image:
          'https://koboko-portfolio-media-332ac5.s3.eu-west-1.amazonaws.com/media/blog/images/Met_5_O0jTFuL.jpeg',
        alt_text: '',
        caption: '',
        order: 0,
      },
      {
        id: 2,
        image:
          'https://koboko-portfolio-media-332ac5.s3.eu-west-1.amazonaws.com/media/blog/images/Met2.jpeg',
        alt_text: 'Satellite Imagery',
        caption: 'Atmosphere Current State',
        order: 1,
      },
      {
        id: 1,
        image:
          'https://koboko-portfolio-media-332ac5.s3.eu-west-1.amazonaws.com/media/blog/images/Met_5.jpeg',
        alt_text: 'SuperComputers',
        caption: 'High Computations',
        order: 2,
      },
    ],
  },
};
