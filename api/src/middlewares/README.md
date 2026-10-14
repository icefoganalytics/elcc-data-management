# Middlewares

Middleware are actions that run before or after every request.

## Purpose

Middlewares handle cross-cutting concerns like:
- Authentication and authorization
- Request logging
- Error handling
- Rate limiting
- CORS configuration
- Request validation

## Structure

Each middleware should be a function that:
- Takes request, response, and next function as parameters
- Performs its specific task
- Calls next() to pass control to the next middleware
- Handles errors appropriately

## Example Structure

```typescript
// api/src/middlewares/request-logger.ts
import type { Request, Response, NextFunction } from "express"
import logger from "@/utils/logger"

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  
  // Log request
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  })

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.path} completed`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    })
    originalEnd.call(this, chunk, encoding)
  }

  next()
}
```

## Usage in Routes

```typescript
// api/src/routes/index.ts
import { requestLogger } from "@/middlewares"

router.use(requestLogger)
router.use(authenticationMiddleware)
router.use('/api', apiRoutes)
```

## Conventions

- Use TypeScript types for req, res, next parameters
- Handle errors properly and pass them to next(error)
- Use async/await when needed
- Include proper logging
- Keep middleware focused on a single responsibility
- Use descriptive function names
- Document what each middleware does
