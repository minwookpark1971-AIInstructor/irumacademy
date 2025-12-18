/**
 * Courses Data
 * Embedded data to avoid CORS issues with file:// protocol
 */
const COURSES_DATA = [
  {
    "slug": "marketing-ai",
    "title": "AI 마케팅 실무",
    "category": "마케팅",
    "shortDescription": "AI 도구를 활용한 마케팅 전략 수립부터 실행까지, 실무에 바로 적용 가능한 마케팅 역량을 강화합니다.",
    "durationLabel": "6주",
    "formatLabel": "온라인 실시간 + 과제",
    "tools": ["ChatGPT", "Claude", "GA4", "Make.com", "Canva", "Midjourney"]
  },
  {
    "slug": "planning-ai",
    "title": "AI 기획 실무",
    "category": "기획",
    "shortDescription": "AI를 활용한 기획 프로세스부터 실행까지, 체계적인 기획 역량을 강화하고 실무에 바로 적용할 수 있는 스킬을 습득합니다.",
    "durationLabel": "5주",
    "formatLabel": "온라인 실시간 + 프로젝트",
    "tools": ["ChatGPT", "Claude", "Notion", "Figma", "Miro"]
  },
  {
    "slug": "dev-ai",
    "title": "AI 개발 실무",
    "category": "개발",
    "shortDescription": "AI 도구를 활용한 개발 프로세스 최적화부터 코드 생성, 테스트 자동화까지 실무 개발 역량을 강화합니다.",
    "durationLabel": "6주",
    "formatLabel": "온라인 실시간 + 실습",
    "tools": ["ChatGPT", "GitHub Copilot", "Cursor", "Git", "VS Code", "Postman"]
  },
  {
    "slug": "design-ai",
    "title": "AI 디자인 실무",
    "category": "디자인",
    "shortDescription": "AI 도구를 활용한 디자인 프로세스부터 자동화까지, 창의적이고 효율적인 디자인 역량을 강화합니다.",
    "durationLabel": "5주",
    "formatLabel": "온라인 실시간 + 포트폴리오",
    "tools": ["Midjourney", "DALL-E", "Figma", "Adobe Firefly", "Canva", "ChatGPT"]
  },
  {
    "slug": "sales-ai",
    "title": "AI 영업 실무",
    "category": "영업실무",
    "shortDescription": "AI를 활용한 영업 프로세스 최적화부터 고객 관리까지, 영업 성과를 극대화하는 실무 역량을 강화합니다.",
    "durationLabel": "5주",
    "formatLabel": "온라인 실시간 + 롤플레이",
    "tools": ["ChatGPT", "Claude", "CRM", "Make.com", "LinkedIn", "Zoom"]
  },
  {
    "slug": "hr-ai",
    "title": "AI 인사행정 실무",
    "category": "인사행정",
    "shortDescription": "AI를 활용한 인사 프로세스 최적화부터 채용, 평가, 개발까지 HR 실무 역량을 강화합니다.",
    "durationLabel": "5주",
    "formatLabel": "온라인 실시간 + 케이스 스터디",
    "tools": ["ChatGPT", "HRIS", "ATS", "Make.com", "Excel", "Power BI"]
  },
  {
    "slug": "job-bootcamp",
    "title": "공기업 사기업 취업특강",
    "category": "취업특강",
    "shortDescription": "2026년 공기업과 사기업의 높아진 문턱에 맞는 새로운 전략과 과거의 성공적인 취업 노하우를 제공합니다.",
    "durationLabel": "6주",
    "formatLabel": "온라인 실시간 + 멘토링",
    "tools": ["ChatGPT", "LinkedIn", "Notion", "Canva", "Zoom"]
  },
  {
    "slug": "career-ai",
    "title": "AI 취업 특강: 6시간에 끝내는 취업 전략",
    "category": "취업",
    "shortDescription": "AI·ATS 시대, 이력서부터 면접까지 한번에 끝내는 실전 취업 전략. AI를 활용해 서류 합격률을 높이고 면접을 완벽하게 대비하세요.",
    "durationLabel": "6시간",
    "formatLabel": "원데이 특강",
    "tools": ["ChatGPT", "Claude", "ATS", "Notion"]
  },
  {
    "slug": "employee-ai",
    "title": "기업재직자 AI경쟁력 강화",
    "category": "실무 역량",
    "shortDescription": "기업의 디지털 전환 시대, AI 도구를 활용한 실무 생산성 향상과 업무 자동화를 통해 재직자의 핵심 경쟁력을 강화하는 맞춤형 교육 프로그램입니다.",
    "durationLabel": "8시간 (1일 집중과정) 또는 4시간 × 2일",
    "formatLabel": "이론 40% + 실습 60%",
    "tools": ["ChatGPT", "Claude", "Notion", "Gamma"]
  }
];

// Helper function to get course by slug
function getCourseBySlug(slug) {
    return COURSES_DATA.find(course => course.slug === slug);
}

// Helper function to get courses by category
function getCoursesByCategory(category) {
    return COURSES_DATA.filter(course => course.category === category);
}


