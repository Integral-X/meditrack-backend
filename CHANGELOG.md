# [1.11.0](https://github.com/Integral-X/prismacv-backend/compare/v1.10.0...v1.11.0) (2026-06-19)


### Features

* persist CV section layout (order, hidden, heading overrides) ([#178](https://github.com/Integral-X/prismacv-backend/issues/178)) ([fbcf5cc](https://github.com/Integral-X/prismacv-backend/commit/fbcf5cc1f52528085e4fe5971f8ddab6560843bf))

# [1.10.0](https://github.com/Integral-X/prismacv-backend/compare/v1.9.0...v1.10.0) (2026-05-08)


### Bug Fixes

* provide shadow database for prisma drift check ([#176](https://github.com/Integral-X/prismacv-backend/issues/176)) ([f03ac56](https://github.com/Integral-X/prismacv-backend/commit/f03ac56ffafbd0bb7272597b92e71f2fcbd93588))


### Features

* complete feature-ready backend implementation plan ([#175](https://github.com/Integral-X/prismacv-backend/issues/175)) ([77eaa2a](https://github.com/Integral-X/prismacv-backend/commit/77eaa2a445c3f6806608a26457aa97701f448b9a))

# [1.9.0](https://github.com/Integral-X/prismacv-backend/compare/v1.8.1...v1.9.0) (2026-05-07)


### Features

* add ATS score module ([#170](https://github.com/Integral-X/prismacv-backend/issues/170)) ([efaa4c9](https://github.com/Integral-X/prismacv-backend/commit/efaa4c9a416fa21e04a99719c71652e1c12593b6))

## [1.8.1](https://github.com/Integral-X/prismacv-backend/compare/v1.8.0...v1.8.1) (2026-05-07)


### Bug Fixes

* backend hardening — all-exceptions filter, AI rate limits, disable Swagger in prod ([#172](https://github.com/Integral-X/prismacv-backend/issues/172)) ([56d3e4b](https://github.com/Integral-X/prismacv-backend/commit/56d3e4b1a3f46b04dc2bc044107fa9cec33a5090))

# [1.8.0](https://github.com/Integral-X/prismacv-backend/compare/v1.7.2...v1.8.0) (2026-05-06)


### Features

* add cover letters module ([#171](https://github.com/Integral-X/prismacv-backend/issues/171)) ([8681499](https://github.com/Integral-X/prismacv-backend/commit/8681499efcd7cffe374b5ea42d856c7cfa77f6c2))

## [1.7.2](https://github.com/Integral-X/prismacv-backend/compare/v1.7.1...v1.7.2) (2026-05-06)


### Bug Fixes

* wire seed-features into main seed script ([#169](https://github.com/Integral-X/prismacv-backend/issues/169)) ([479ab35](https://github.com/Integral-X/prismacv-backend/commit/479ab35b3fd01f0714ddcc4457d4113d8c8458da))

## [1.7.1](https://github.com/Integral-X/prismacv-backend/compare/v1.7.0...v1.7.1) (2026-05-03)


### Bug Fixes

* add missing migration for platform tables (jobs, skills, interview) ([#163](https://github.com/Integral-X/prismacv-backend/issues/163)) ([7e04222](https://github.com/Integral-X/prismacv-backend/commit/7e042223bde311cd363f1729caeaac29f28b2ca0))

# [1.7.0](https://github.com/Integral-X/prismacv-backend/compare/v1.6.6...v1.7.0) (2026-05-03)


### Features

* Complete platform features - Jobs, AI, Skills, Interview modules ([#162](https://github.com/Integral-X/prismacv-backend/issues/162)) ([074fa4f](https://github.com/Integral-X/prismacv-backend/commit/074fa4f19b1e7ef0fd72df396808f8800fd21fa0))

## [1.6.6](https://github.com/Integral-X/prismacv-backend/compare/v1.6.5...v1.6.6) (2026-05-03)


### Bug Fixes

* prevent OAuth strategies from crashing DI on missing env vars ([#160](https://github.com/Integral-X/prismacv-backend/issues/160)) ([3fc3885](https://github.com/Integral-X/prismacv-backend/commit/3fc3885e64d7a44ee4392996eb73ac6a17d9dbb2))

## [1.6.5](https://github.com/Integral-X/prismacv-backend/compare/v1.6.4...v1.6.5) (2026-05-03)


### Bug Fixes

* correct OAuth callback response shape and LinkedIn import auth ([#159](https://github.com/Integral-X/prismacv-backend/issues/159)) ([3553902](https://github.com/Integral-X/prismacv-backend/commit/3553902d872c5d1f6363f21e1dfa7b0f3ee77b26))

## [1.6.4](https://github.com/Integral-X/prismacv-backend/compare/v1.6.3...v1.6.4) (2026-04-30)


### Bug Fixes

* make OAuth endpoints public and redirect to frontend ([#158](https://github.com/Integral-X/prismacv-backend/issues/158)) ([d67baee](https://github.com/Integral-X/prismacv-backend/commit/d67baeebf0170a7c6df31697a6b4a01f30281095))

## [1.6.3](https://github.com/Integral-X/prismacv-backend/compare/v1.6.2...v1.6.3) (2026-04-29)


### Bug Fixes

* exclude prisma dir from tsconfig.build to fix dist output path ([#156](https://github.com/Integral-X/prismacv-backend/issues/156)) ([28a4a96](https://github.com/Integral-X/prismacv-backend/commit/28a4a9676e71e1f5e699b20aeb0f77779011b5f8))

## [1.6.2](https://github.com/Integral-X/prismacv-backend/compare/v1.6.1...v1.6.2) (2026-04-29)


### Bug Fixes

* exclude prisma dir from tsconfig.build to fix dist output path ([da8f54c](https://github.com/Integral-X/prismacv-backend/commit/da8f54cef0887576e3bd7c0dd66b6aa9cee53f43))

## [1.6.1](https://github.com/Integral-X/prismacv-backend/compare/v1.6.0...v1.6.1) (2026-04-29)


### Bug Fixes

* resolve docker deployment issue ([#155](https://github.com/Integral-X/prismacv-backend/issues/155)) ([644aa8c](https://github.com/Integral-X/prismacv-backend/commit/644aa8cc18388c6c30a554bbf7dbb8d4c6fcbacf))

# [1.6.0](https://github.com/Integral-X/prismacv-backend/compare/v1.5.0...v1.6.0) (2026-04-29)


### Features

* CV module with full CRUD, PDF export, templates, LinkedIn import, and user profile ([#154](https://github.com/Integral-X/prismacv-backend/issues/154)) ([bdba509](https://github.com/Integral-X/prismacv-backend/commit/bdba509bac30a3360047f6f03458b0d8a869d7b6))

# [1.5.0](https://github.com/Integral-X/prismacv-backend/compare/v1.4.0...v1.5.0) (2026-04-18)


### Features

* **auth:** JWT architecture overhaul — dual-audience tokens + user auth flow ([#149](https://github.com/Integral-X/prismacv-backend/issues/149)) ([fa71f28](https://github.com/Integral-X/prismacv-backend/commit/fa71f280dc4e8980ac37a88e61f3aebb5b8798df))

# [1.4.0](https://github.com/Integral-X/prismacv-backend/compare/v1.3.1...v1.4.0) (2026-02-25)


### Features

* implement LinkedIn CV import functionality ([#134](https://github.com/Integral-X/prismacv-backend/issues/134)) ([8956f2f](https://github.com/Integral-X/prismacv-backend/commit/8956f2fc09e4c11850bc9f40e578db5db6a8470c))

## [1.3.1](https://github.com/Integral-X/prismacv-backend/compare/v1.3.0...v1.3.1) (2026-02-17)


### Bug Fixes

* remove duplicate v1 in API paths ([#129](https://github.com/Integral-X/prismacv-backend/issues/129)) ([b9b3afe](https://github.com/Integral-X/prismacv-backend/commit/b9b3afe8d52256a3920d35e5a4db24dfc5d999a7))

# [1.3.0](https://github.com/Integral-X/prismacv-backend/compare/v1.2.3...v1.3.0) (2026-01-24)


### Features

* **auth:** master admin provisioning and role management ([#108](https://github.com/Integral-X/prismacv-backend/issues/108)) ([50fed08](https://github.com/Integral-X/prismacv-backend/commit/50fed08e1c0c475c736498f13062b42ff6ada096))

## [1.2.3](https://github.com/Integral-X/prismacv-backend/compare/v1.2.2...v1.2.3) (2025-11-30)


### Bug Fixes

* api doc and refactored code ([#74](https://github.com/Integral-X/prismacv-backend/issues/74)) ([2682af7](https://github.com/Integral-X/prismacv-backend/commit/2682af7da863e489a2289ffaa5cf312ba53268d9))

## [1.2.2](https://github.com/Integral-X/prismacv-backend/compare/v1.2.1...v1.2.2) (2025-11-08)


### Bug Fixes

* separate release workflow ([#47](https://github.com/Integral-X/prismacv-backend/issues/47)) ([64dd1e4](https://github.com/Integral-X/prismacv-backend/commit/64dd1e481ec5573d6f0e3524115140608d46725b))
