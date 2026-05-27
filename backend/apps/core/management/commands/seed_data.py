"""Populate the database with meaningful portfolio data."""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta


BLOG_CONTENT: dict = {
    'django-rest-api': """
## Building Scalable Django REST APIs

A well-architected API is the backbone of any modern web application. Over the past few years, building production systems with Django REST Framework has taught me that scalability begins with discipline in the earliest design decisions.

### Project Structure

The biggest mistake I see in Django projects is a flat structure. Apps should be domain-driven, not feature-driven. Here's the structure I use in every professional project:

```
project/
├── config/          # Settings, URLs, WSGI
├── apps/
│   ├── blog/        # Domain: content
│   ├── users/       # Domain: identity
│   └── core/        # Domain: shared utilities
└── utils/           # Cross-cutting concerns
```

### Serializer Design

Serializers are your API's contract. Keep them thin and purposeful:

```python
class ArticleListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()

    def get_comment_count(self, obj):
        return obj.comments.filter(approved=True).count()
```

Always use separate serializers for list vs detail views. List views should carry only what the UI needs — loading 50 full article objects with nested relations is a common performance killer.

### Pagination & Filtering

Never return unbounded collections. Use `PageNumberPagination` with sensible defaults, and combine `django-filter` with DRF's built-in `SearchFilter` for flexible querying:

```
GET /api/articles/?category=technology&search=django&ordering=-published_date
```

### Caching Strategy

For read-heavy endpoints like article lists, use Redis-backed caching with a short TTL:

```python
from django.core.cache import cache

def get_queryset(self):
    cached = cache.get('articles_list')
    if cached:
        return cached
    qs = BlogArticle.objects.filter(published=True).select_related('category')
    cache.set('articles_list', qs, timeout=300)
    return qs
```

### Conclusion

Clean architecture, thoughtful serialization, and aggressive caching are the three pillars of a production-ready Django API. The patterns here scale from a side project to an enterprise system — the discipline required is the same.
""",
    'weather-prediction': """
## Understanding Numerical Weather Prediction

Numerical Weather Prediction (NWP) is the science — and art — of translating atmospheric physics into computational models that forecast tomorrow's weather. As a meteorologist at the Kenya Meteorological Department, I work with these models daily.

### The Physics Behind the Forecast

The atmosphere follows well-understood physical laws: the Navier-Stokes equations govern fluid motion, thermodynamic laws govern heat exchange, and radiative transfer equations govern energy balance. NWP encodes these into discrete grid-point calculations.

Modern models like the ECMWF IFS (Integrated Forecasting System) divide the atmosphere into a grid — currently around 9km horizontal resolution globally — and solve these equations forward in time from an initial state.

### Data Assimilation: The Hidden Foundation

Before a single forecast is made, thousands of observations must be woven into a consistent atmospheric state. This is **data assimilation** — arguably the most computationally expensive part of NWP.

Observations come from:
- **Radiosondes** (weather balloons) — temperature, humidity, winds at altitude
- **Satellites** — both passive (radiance) and active (radar/lidar backscatter)
- **Surface stations** — ground truth at fixed points
- **Aircraft** (AMDAR) — cruising altitude data from commercial flights

The Kenya Meteorological Department ingests regional observations for the East African domain, which presents unique challenges: the Indian Ocean moisture flux, the Great Rift Valley orographic forcing, and the diurnal heating cycle of the continent all interact in ways that coarser global models underrepresent.

### What the Models Get Right (and Wrong)

Short-range forecasts (0-24h) are remarkably accurate for large-scale features. The skill degrades with lead time — by day 10, global models are roughly as skillful as a climatological forecast.

The hardest problems remain:
- **Convective initiation** — predicting when and where a thunderstorm triggers
- **Fog and low cloud** — highly sensitive to small boundary layer errors
- **Orographic precipitation** — mountain-induced rainfall at scales below model resolution

### Machine Learning's Role

The breakthrough of 2023 was Google DeepMind's GraphCast and ECMWF's AIFS — both machine learning models that match or exceed the IFS in medium-range skill at a fraction of the computational cost. I'm currently exploring how to apply similar techniques to the East African regional domain.

NWP is one of humanity's great predictive achievements. The fact that we can look 5 days forward with meaningful skill across a planet of chaotic fluid dynamics is genuinely humbling.
""",
    'fashion': (
        "## The Art of Intentional Dressing\n\n"
        "Clothes are the first language we speak before we open our mouths.\n\n"
        "I grew up in a home where how you presented yourself was considered a form of respect — "
        "for yourself and for the people you were meeting.\n\n"
        "### Character Before Cloth\n\n"
        "The mistake most men make when thinking about fashion is starting with the clothes. "
        "Start with character. Clothes amplify what is already there.\n\n"
        "### African Elegance\n\n"
        "There is a growing conversation in African fashion about reclaiming our aesthetic heritage. "
        "I wear *kitenge* proudly — not as costume, but as continuity.\n\n"
        "### Practical Principles\n\n"
        "1. **Fit is everything.** A tailored affordable suit beats an ill-fitting expensive one.\n"
        "2. **Build a base.** Navy, charcoal, white, and camel cover 90% of occasions.\n"
        "3. **One statement piece.** Let one item carry the personality.\n"
        "4. **Care for what you own.** Iron. Hang properly. Polish shoes."
    ),
    'data-science': (
        "## What Data Science Taught Me About Uncertainty\n\n"
        "The most profound lesson from meteorology and data science is not a technique. "
        "It is an epistemological posture: **embrace uncertainty with precision**.\n\n"
        "### The Deterministic Trap\n\n"
        "Most people want answers. Will it rain tomorrow? We are wired to want certainty.\n\n"
        "But the world is not deterministic. The atmosphere is a chaotic system. "
        "A forecaster who says 'it will rain tomorrow' without a probability gives false confidence.\n\n"
        "### Confidence Intervals as Intellectual Honesty\n\n"
        "In statistics, a confidence interval is not a hedge. It is precision. "
        "When I say '70% probability of rainfall exceeding 20mm,' I am communicating real information.\n\n"
        "### The Gospel of Getting It Wrong\n\n"
        "Good data scientists obsess over their errors. Post-mortems are not punishment. "
        "They are the feedback loops that make us better."
    ),
    'mentoring': (
        "## Mentoring Young Men: What I Have Learned\n\n"
        "Five years ago, I started Great Men Moves with a simple observation: "
        "the young men around me were talented, energetic, and directionless.\n\n"
        "### Presence Is the Programme\n\n"
        "The greatest lesson of five years: the programme matters far less than the relationship. "
        "The young men remember a phone call at 11pm when something broke in their lives.\n\n"
        "### What Young Men Actually Need\n\n"
        "1. **To be seen** — not assessed, but genuinely seen.\n"
        "2. **Permission to be uncertain** — masculinity still punishes doubt.\n"
        "3. **Models of integrated manhood** — professionally competent AND emotionally present.\n"
        "4. **Accountability with warmth** — holding someone to a standard with their dignity intact.\n\n"
        "### The Hardest Part\n\n"
        "The hardest part is watching young men make choices you know will hurt them. "
        "Great Men Moves is not about creating successful men. "
        "It is about walking alongside human beings on the road to becoming."
    ),
    'faith-technology': """
## Faith in the Age of Algorithms

There is a question I return to often: does my faith change how I build software?

The short answer is yes — profoundly.

### The Ethics of What We Build

Every API endpoint, every model, every line of code represents a choice about what world we want to create. Software is not neutral. A recommendation system that maximizes engagement often maximises outrage. A hiring algorithm trained on historical data encodes historical bias. A social platform designed for compulsive use erodes attention and community.

Faith, at its core, is an orientation toward the flourishing of persons. My tradition — rooted in the conviction that each person bears inherent dignity — creates a lens through which I evaluate what I build.

> *"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."* — Colossians 3:23

This verse doesn't only demand excellence. It demands integrity about *what* we work on.

### Presence vs Productivity

The tech industry worships productivity. Optimise your morning routine. Eliminate friction. Ship faster. Move on.

But the great spiritual traditions all converge on a different wisdom: the quality of your presence matters more than the quantity of your output. A conversation held with full attention accomplishes more than ten half-present meetings. Code written with understanding and care survives refactoring; code written under panic creates technical debt that costs years.

I've found that the practices of my faith — prayer, Sabbath, communal worship — are not in tension with my work. They restore the presence that the work demands.

### Mentorship as Vocation

Great Men Moves grew from a simple conviction: that raising the next generation of men is sacred work. Not optional. Not a side project. A vocation.

The software I build may touch thousands of users. The men I mentor will shape families, organisations, and communities for decades. Technology scales reach; relationship shapes character. Both matter. The question of how to allocate my finite time between them is one I'm still learning to answer.
""",
}


class Command(BaseCommand):
    help = 'Seed the database with sample portfolio data'

    def handle(self, *args, **options):
        self._seed_profile()
        self._seed_skills()
        self._seed_blog()
        self._seed_projects()
        self._seed_fashion()
        self._seed_music()
        self._seed_books()
        self._seed_gmm()
        self._seed_newsletter()
        self.stdout.write(self.style.SUCCESS('\n✓ Database seeded successfully!'))

    def _seed_profile(self):
        from apps.core.models import Profile
        Profile.objects.all().delete()
        Profile.objects.create(
            full_name='Msizi Koboko',
            tagline='Meteorologist · Backend Developer · Creator · Mentor',
            bio=(
                'I am a Kenyan meteorologist and software developer who believes that science, '
                'faith, and creativity are not competing forces but complementary ones. '
                'At the Kenya Meteorological Department, I work in the Numerical Weather Prediction section. '
                'I build backend systems with Python and Django, mentor young men through Great Men Moves, '
                'create gospel music, and am writing my debut book "Broken Souls." '
                'Every discipline I practice is an act of service.'
            ),
            linkedin_url='https://linkedin.com/in/msizi',
            github_url='https://github.com/msizi',
            twitter_url='https://twitter.com/msizi',
            instagram_url='https://instagram.com/msizi',
            years_experience=5,
            projects_completed=18,
        )
        self.stdout.write('  ✓ Profile')

    def _seed_skills(self):
        from apps.core.models import Skill
        Skill.objects.all().delete()
        skills = [
            ('Python', 'backend', 92, 'python'),
            ('Django', 'backend', 90, 'django'),
            ('Django REST Framework', 'backend', 88, 'drf'),
            ('PostgreSQL', 'backend', 82, 'postgresql'),
            ('MongoDB', 'backend', 72, 'mongodb'),
            ('React', 'frontend', 78, 'react'),
            ('TypeScript', 'frontend', 75, 'typescript'),
            ('Tailwind CSS', 'frontend', 85, 'tailwind'),
            ('Git', 'devops', 90, 'git'),
            ('Docker', 'devops', 68, 'docker'),
            ('Linux', 'devops', 80, 'linux'),
            ('UI/UX Design', 'design', 70, 'layers'),
            ('Numerical Weather Prediction', 'other', 88, 'cloud'),
            ('Data Analysis (NumPy/Pandas)', 'other', 82, 'chart'),
            ('Machine Learning', 'other', 65, 'brain'),
        ]
        for i, (name, cat, prof, icon) in enumerate(skills):
            Skill.objects.create(name=name, category=cat, proficiency=prof, icon=icon, order=i)
        self.stdout.write(f'  ✓ {len(skills)} skills')

    def _seed_blog(self):
        from apps.blog.models import BlogCategory, BlogArticle
        BlogArticle.objects.all().delete()
        BlogCategory.objects.all().delete()

        cats = {}
        for name, icon, color in [
            ('Software Engineering', 'code', '#3b82f6'),
            ('Meteorology', 'cloud', '#0ea5e9'),
            ('Faith & Purpose', 'heart', '#d4a574'),
            ('Fashion', 'shirt', '#8b5cf6'),
            ('Gospel Music', 'music', '#ec4899'),
            ('Leadership', 'users', '#10b981'),
            ('Data Science', 'bar-chart', '#f59e0b'),
        ]:
            cats[name] = BlogCategory.objects.create(name=name, icon=icon, color=color)

        articles = [
            {
                'title': 'Building Scalable Django REST APIs',
                'excerpt': 'Best practices for architecting production-grade APIs with Django REST Framework — from project structure to caching strategy.',
                'content': BLOG_CONTENT['django-rest-api'],
                'category': cats['Software Engineering'],
                'tags': ['Django', 'Python', 'REST API', 'Backend', 'Architecture'],
                'read_time': 8,
                'is_featured': True,
                'author_bio': 'Backend developer with 5 years building production Django systems.',
            },
            {
                'title': 'Understanding Numerical Weather Prediction',
                'excerpt': 'How modern meteorology translates atmospheric physics into computational models — and why East Africa presents unique forecasting challenges.',
                'content': BLOG_CONTENT['weather-prediction'],
                'category': cats['Meteorology'],
                'tags': ['NWP', 'Forecasting', 'Atmospheric Science', 'Machine Learning'],
                'read_time': 10,
                'is_featured': True,
                'author_bio': 'Meteorologist at the Kenya Meteorological Department, NWP Section.',
            },
            {
                'title': 'Faith in the Age of Algorithms',
                'excerpt': 'Does faith change how I build software? Profoundly yes. On ethics, presence, and mentorship as vocation in the age of AI.',
                'content': BLOG_CONTENT['faith-technology'],
                'category': cats['Faith & Purpose'],
                'tags': ['Faith', 'Technology', 'Ethics', 'Purpose', 'Mentorship'],
                'read_time': 7,
                'is_featured': True,
                'author_bio': 'Follower of Jesus, builder of things, mentor of men.',
            },
            {
                'title': 'The Art of Intentional Dressing',
                'excerpt': 'Fashion is not vanity — it is communication. On classic tailoring, African aesthetics, and dressing with conviction.',
                'content': BLOG_CONTENT['fashion'],
                'category': cats['Fashion'],
                'tags': ['Fashion', 'Style', 'African Aesthetics', 'Menswear'],
                'read_time': 6,
            },
            {
                'title': 'What Data Science Taught Me About Uncertainty',
                'excerpt': 'Probabilistic thinking, confidence intervals, and why being wrong with precision is more useful than being vaguely right.',
                'content': BLOG_CONTENT['data-science'],
                'category': cats['Data Science'],
                'tags': ['Data Science', 'Statistics', 'Machine Learning', 'Epistemology'],
                'read_time': 9,
            },
            {
                'title': 'Mentoring Young Men: What I Have Learned',
                'excerpt': 'Five years of running Great Men Moves — the failures, the breakthroughs, and the one thing that changes everything in a young man\'s life.',
                'content': BLOG_CONTENT['mentoring'],
                'category': cats['Leadership'],
                'tags': ['Mentorship', 'Great Men Moves', 'Leadership', 'Character', 'Youth'],
                'read_time': 8,
            },
        ]
        for i, data in enumerate(articles):
            published = timezone.now() - timedelta(days=i * 12)
            BlogArticle.objects.create(**data, published_date=published)
        self.stdout.write(f'  ✓ {len(articles)} blog articles')

    def _seed_projects(self):
        from apps.projects.models import ProjectCategory, Project
        Project.objects.all().delete()
        ProjectCategory.objects.all().delete()

        cats = {}
        for name, icon, color in [
            ('Web Development', 'globe', '#d4a574'),
            ('API & Backend', 'server', '#3b82f6'),
            ('Data & Science', 'bar-chart', '#8b5cf6'),
            ('Community', 'users', '#10b981'),
        ]:
            cats[name] = ProjectCategory.objects.create(name=name, icon=icon, color=color)

        projects = [
            {
                'title': 'Portfolio Website',
                'description': 'Full-stack personal portfolio with React frontend and Django REST Framework backend.',
                'detailed_description': 'This site — built with React 18, TypeScript, Tailwind CSS, and a Django REST API backend. Features include a CMS-driven blog with comments, reactions and shares; project showcase; fashion gallery; music ministry; newsletter system; and the Great Men Moves platform.',
                'category': cats['Web Development'],
                'technologies': ['React', 'TypeScript', 'Django', 'DRF', 'PostgreSQL', 'Tailwind CSS', 'Vite'],
                'github_url': 'https://github.com/msizi/portfolio',
                'year': 2024,
                'is_featured': True,
            },
            {
                'title': '72-Hour Meteorology Forecast App',
                'description': 'Real-time weather forecasting visualisation using OpenWeatherMap data and interactive Recharts.',
                'detailed_description': 'Interactive weather dashboard showing hourly and daily forecasts for configurable locations. Built as a demonstration of how publicly available NWP model output can be surfaced in accessible visualisations. Covers temperature trends, precipitation probability, wind speed, and humidity.',
                'category': cats['Data & Science'],
                'technologies': ['React', 'Recharts', 'Django', 'OpenWeatherMap API', 'TypeScript'],
                'github_url': 'https://github.com/msizi/weather-app',
                'year': 2024,
                'is_featured': True,
            },
            {
                'title': 'Great Men Moves Platform',
                'description': 'Community platform for the Great Men Moves nonprofit — volunteer management, program registration, and impact tracking.',
                'detailed_description': 'Full-featured platform for the GMM nonprofit initiative. Enables program discovery and registration, volunteer applications, impact metric tracking, and newsletter delivery. Backend is Django with DRF; frontend is React.',
                'category': cats['Community'],
                'technologies': ['Django', 'DRF', 'React', 'PostgreSQL', 'Tailwind CSS'],
                'github_url': 'https://github.com/msizi/gmm-platform',
                'year': 2024,
                'is_featured': True,
            },
            {
                'title': 'Django Blog Engine with Interactions',
                'description': 'Production-ready blog system with Markdown content, comments, emoji reactions, likes, and share tracking.',
                'detailed_description': 'Open-source blog engine extracted from this portfolio. Supports Markdown authoring with syntax highlighting, threaded comments, emoji reactions, IP-fingerprinted likes, and platform share counts. Exposes a full REST API for headless usage.',
                'category': cats['API & Backend'],
                'technologies': ['Django', 'DRF', 'Markdown', 'PostgreSQL', 'Python'],
                'github_url': 'https://github.com/msizi/django-blog-engine',
                'year': 2024,
            },
            {
                'title': 'African Weather Data Pipeline',
                'description': 'ETL pipeline for ingesting and processing East African meteorological observation data.',
                'detailed_description': 'Automated data pipeline that ingests SYNOP, radiosonde, and satellite observations, performs quality control, and prepares data for assimilation into regional NWP models. Written in Python with Pandas and xarray.',
                'category': cats['Data & Science'],
                'technologies': ['Python', 'Pandas', 'xarray', 'netCDF4', 'PostgreSQL', 'Celery'],
                'year': 2023,
            },
        ]
        for i, data in enumerate(projects):
            Project.objects.create(**data, order=i)
        self.stdout.write(f'  ✓ {len(projects)} projects')

    def _seed_fashion(self):
        from apps.fashion.models import FashionCategory
        FashionCategory.objects.all().delete()
        cats = ['Executive', 'Contemporary', 'Essential', 'African Heritage', 'Layers', 'Details']
        for cat in cats:
            FashionCategory.objects.create(name=cat)
        self.stdout.write(f'  ✓ {len(cats)} fashion categories (upload images via admin)')

    def _seed_music(self):
        from apps.music.models import MusicTrack
        MusicTrack.objects.all().delete()
        tracks = [
            {
                'title': 'Grace Sufficient',
                'description': 'A worship declaration drawn from 2 Corinthians 12:9 — that in weakness, His strength is perfected. Written during a season of professional uncertainty.',
                'duration': '4:32',
                'is_featured': True,
            },
            {
                'title': 'Broken Made Whole',
                'description': 'Companion piece to the book "Broken Souls." A song about the redemption that meets us in our most fractured places.',
                'duration': '3:58',
                'is_featured': True,
            },
            {
                'title': 'Rise Up Men',
                'description': 'Written as an anthem for Great Men Moves. A call to young men to take their place — not in dominance, but in purpose and service.',
                'duration': '5:10',
            },
            {
                'title': 'Still Waters',
                'description': 'An instrumental-vocal reflection on Psalm 23, recorded during a personal retreat. Meant for quiet mornings.',
                'duration': '3:45',
            },
            {
                'title': 'The Forecaster\'s Prayer',
                'description': 'An unusual piece — a worship song written from the perspective of a meteorologist. About holding the limits of human knowledge before the infinite.',
                'duration': '4:15',
            },
        ]
        for i, t in enumerate(tracks):
            MusicTrack.objects.create(**t, order=i)
        self.stdout.write(f'  ✓ {len(tracks)} music tracks')

    def _seed_books(self):
        from apps.books.models import Book, BookTestimonial
        BookTestimonial.objects.all().delete()
        Book.objects.all().delete()

        book = Book.objects.create(
            title='Broken Souls',
            subtitle='Finding Wholeness in a Fractured World',
            description=(
                '"Broken Souls" is a book about the hidden wounds that men carry — '
                'the silent suffering of those who were never taught to speak their pain, '
                'and the quiet heroism of those who sought healing anyway. '
                'Through raw testimonies, scriptural reflection, and hard-won personal insight, '
                'this book maps a path from fragmentation toward wholeness. '
                'It is for any man who has felt that the pieces of his life do not fit together — '
                'and who dares to believe they could.'
            ),
            author='Msizi Koboko',
            page_count=248,
            publisher='Forthcoming',
            is_published=False,
        )

        testimonials = [
            (
                'Msizi writes with a vulnerability that is rare among African men in public life. This manuscript moved me to tears and then to action.',
                'Pastor James Kariuki', 'Lead Pastor, Restoration Church Nairobi', 5
            ),
            (
                'Raw, honest, and deeply therapeutic. "Broken Souls" fills a gap in the literature on African male psychology that I have wanted filled for years.',
                'Dr. Sarah Mwangi', 'Clinical Psychologist, Nairobi', 5
            ),
            (
                'The chapter on fatherlessness alone is worth the entire book. Every son of an absent father will recognise himself in these pages.',
                'Thomas Omondi', 'Author & Leadership Consultant', 5
            ),
            (
                'I don\'t cry easily. I cried reading this. Msizi has done something extraordinary.',
                'Kevin Otieno', 'Youth Worker, Kisumu', 5
            ),
        ]
        for i, (quote, name, title, rating) in enumerate(testimonials):
            BookTestimonial.objects.create(
                book=book, quote=quote, author_name=name, author_title=title, rating=rating, order=i
            )
        self.stdout.write('  ✓ 1 book + testimonials')

    def _seed_gmm(self):
        from apps.great_men_moves.models import GreatMenProgram, ImpactGoal
        ImpactGoal.objects.all().delete()
        GreatMenProgram.objects.all().delete()

        goals = [
            ('500+', 'Men Mentored', 72, 'users'),
            ('14', 'Communities Reached', 60, 'map-pin'),
            ('KSh 2.1M', 'Scholarships Awarded', 48, 'award'),
            ('23', 'Partners & Sponsors', 55, 'handshake'),
        ]
        for i, (num, label, prog, icon) in enumerate(goals):
            ImpactGoal.objects.create(number=num, label=label, progress=prog, icon=icon, order=i)

        programs = [
            {
                'title': 'Leadership Bootcamp — Nairobi',
                'date': date.today() + timedelta(days=32),
                'location': 'Nairobi, Kenya',
                'description': 'An intensive 3-day residential experience for men aged 18-30. Topics: identity, purpose, relational intelligence, financial stewardship.',
                'spots': 40,
            },
            {
                'title': 'Mentorship Programme Launch',
                'date': date.today() + timedelta(days=58),
                'location': 'Mombasa, Kenya',
                'description': 'Matching 25 mentors with 25 mentees for a 6-month guided journey. Application required.',
                'spots': 25,
            },
            {
                'title': 'Father Figure Forum',
                'date': date.today() + timedelta(days=90),
                'location': 'Kisumu, Kenya',
                'description': 'An honest conversation for and about fathers — biological, step, absent, and present. Facilitated by Dr. Ochieng.',
                'spots': 60,
            },
            {
                'title': 'Annual Gala & Awards Night',
                'date': date.today() + timedelta(days=155),
                'location': 'Nairobi, Kenya',
                'description': 'Celebrating community champions and raising funds for the 2026 scholarship fund.',
                'spots': 200,
            },
        ]
        for i, p in enumerate(programs):
            GreatMenProgram.objects.create(**p, order=i)
        self.stdout.write('  ✓ GMM data')

    def _seed_newsletter(self):
        from apps.newsletter.models import NewsletterIssue
        NewsletterIssue.objects.all().delete()

        issues = [
            {
                'number': 5,
                'title': 'On Calibrated Confidence',
                'excerpt': 'What weather forecasting taught me about speaking with certainty in an uncertain world — and why 70% is an honest answer.',
                'published_date': date.today() - timedelta(days=5),
                'topics': ['Meteorology', 'Epistemology', 'Professional Development'],
            },
            {
                'number': 4,
                'title': 'Building with Purpose',
                'excerpt': 'Three questions I ask before starting any new project — and why most side projects die in the absence of a clear "for whom."',
                'published_date': date.today() - timedelta(days=33),
                'topics': ['Software', 'Entrepreneurship', 'Design Thinking'],
            },
            {
                'number': 3,
                'title': 'The Quiet Revolution',
                'excerpt': 'Men stepping up in their communities without fanfare — the untold story of Great Men Moves in its fifth year.',
                'published_date': date.today() - timedelta(days=63),
                'topics': ['Leadership', 'Community', 'GMM Stories'],
            },
            {
                'number': 2,
                'title': 'Code, Craft & Character',
                'excerpt': 'What software engineering teaches about patience, precision, and why "it works on my machine" is a moral failure.',
                'published_date': date.today() - timedelta(days=95),
                'topics': ['Software Engineering', 'Personal Growth', 'Craft'],
            },
            {
                'number': 1,
                'title': 'Where It All Begins',
                'excerpt': 'Why a meteorologist who builds software and mentors men decided to write a newsletter — and what you can expect from it.',
                'published_date': date.today() - timedelta(days=127),
                'topics': ['Introduction', 'Vision', 'Values'],
            },
        ]
        for issue in issues:
            NewsletterIssue.objects.create(**issue)
        self.stdout.write(f'  ✓ {len(issues)} newsletter issues')
