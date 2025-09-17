# System Patterns: Event Planner CRM

## System Architecture

### Overall Structure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   PostgreSQL    │
│   (TypeScript)  │◄──►│   (TypeScript)  │◄──►│    Database     │
│   Port: 5173    │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         └───────────────────────┘
              Socket.io
            (Real-time)
```

### Key Technical Decisions

#### Database Design
- **Connection Pooling**: Using pg-pool for efficient database connections
- **Entity Relationships**: Well-defined foreign key relationships between entities
- **Audit Trail**: Created_at and updated_at timestamps on all entities
- **Soft Deletes**: Using deleted_at for data retention

#### Authentication & Security
- **JWT Tokens**: For stateless authentication
- **Session Management**: Express-session for additional security
- **Rate Limiting**: Express-rate-limit to prevent abuse
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers and CSP

#### Real-time Communication
- **Socket.io**: For live updates and notifications
- **Event-driven**: Socket events for data changes
- **Room Management**: Separate rooms for different event contexts

## Design Patterns in Use

### Backend Patterns
1. **MVC Architecture**: Models, routes, and middleware separation
2. **Middleware Chain**: Request processing through middleware stack
3. **Error Handling**: Centralized error handling with custom middleware
4. **Service Layer**: Business logic separated into services
5. **Repository Pattern**: Database access through models

### Frontend Patterns
1. **Component Architecture**: Reusable React components
2. **Context API**: State management for global state
3. **Custom Hooks**: Reusable logic and state management
4. **Service Layer**: API calls abstracted into services

### Database Patterns
1. **Normalized Design**: Proper database normalization
2. **Foreign Key Constraints**: Data integrity enforcement
3. **Indexing**: Performance optimization on key fields
4. **Audit Fields**: Tracking data changes

## Component Relationships

### Core Entities
- **User**: Central entity for authentication and user management
- **Client**: Customer information and contact details
- **Event**: Central entity linking clients, vendors, and tasks
- **Vendor**: Service providers and suppliers
- **Task**: Action items related to events or clients
- **Payment**: Financial transactions and invoices
- **Lead**: Potential clients and prospects
- **Contact**: Communication history and interactions
- **Activity**: System activity logs and audit trail
- **Deal**: Business opportunities and contracts

### Key Relationships
- User → Events (one-to-many)
- Client → Events (one-to-many)
- Event → Tasks (one-to-many)
- Event → Payments (one-to-many)
- Event → Vendors (many-to-many through event_vendors)
- User → Tasks (one-to-many for assignments)

## API Design Patterns

### RESTful Endpoints
- **GET /api/entities**: List all entities
- **GET /api/entities/:id**: Get specific entity
- **POST /api/entities**: Create new entity
- **PUT /api/entities/:id**: Update entity
- **DELETE /api/entities/:id**: Delete entity

### Error Handling
- **Consistent Error Format**: Standardized error response structure
- **HTTP Status Codes**: Proper use of status codes
- **Validation Errors**: Detailed validation error messages
- **Logging**: Comprehensive error logging with Winston

### Real-time Events
- **Entity Updates**: Broadcast changes to relevant clients
- **Task Assignments**: Notify assigned users
- **Payment Updates**: Alert relevant stakeholders
- **Event Status Changes**: Update all event participants

