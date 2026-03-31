# Appointment to History Flow

## How Appointments Connect to History

### The Complete Flow

```
1. User fills out appointment form (/reserve)
   ↓
2. Form data is submitted
   ↓
3. Data is stored in database/backend
   ↓
4. Appointment goes through statuses:
   - pending → approved/rejected
   - approved → completed/no-show
   ↓
5. History page fetches completed/cancelled/no-show appointments
   ↓
6. Displays them using .map() function
```

### Current Implementation (Mock Data)

Right now, the app uses `MOCK_HISTORY` which simulates appointments that have already been processed:

```typescript
const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "HST-2026-0089",
    status: "completed",  // ← This was once a "pending" appointment
    appointmentDate: "Monday, March 10, 2026 — 9:00 AM",
    reason: "Consultation (general check-up)",
    outcome: "No issues found. Advised to maintain healthy habits.",
  },
  // ... more entries
];
```

### Real Implementation (With Backend)

When connected to a real backend:

1. **User submits appointment** → POST to `/api/appointments`
2. **Backend stores it** → Database saves with status "pending"
3. **Clinic reviews** → Status changes to "approved" or "rejected"
4. **Appointment happens** → Status changes to "completed" or "no-show"
5. **History page loads** → GET `/api/history` fetches finished appointments
6. **Display** → `.map()` renders each appointment as a card

### Data Structure

```typescript
// When user creates appointment (in /reserve)
{
  reason: "Consultation",
  requestedDate: "2026-04-01T10:00:00",
  status: "pending"
}

// After clinic processes it (appears in /history)
{
  id: "HST-2026-0089",
  status: "completed",           // ← Changed from pending
  appointmentDate: "Monday, April 1, 2026 — 10:00 AM",
  reason: "Consultation",
  outcome: "Check-up completed", // ← Added after appointment
  clinicNote: "Patient healthy"  // ← Added by clinic
}
```

---

# How the Mapping Works in History Page

## 1. The `.map()` Function

```jsx
{MOCK_HISTORY.map((entry) => {
  const config = statusConfig[entry.status];
  const StatusIcon = config.icon;
  return (
    <li key={entry.id}>
      <Card>...</Card>
    </li>
  );
})}
```

**What it does:**
- `.map()` iterates over each item in the `MOCK_HISTORY` array
- For each `entry`, it creates a new `<li>` element with a Card inside
- `key={entry.id}` helps React track which items have changed

## 2. Data Flow

```
MOCK_HISTORY (array of objects)
    ↓
.map() loops through each entry
    ↓
For each entry:
  - Look up status config (icon, label, badge color)
  - Render a Card with entry data
    ↓
Returns array of <li> elements
    ↓
Displayed in the <ul> container
```

## 3. Status Configuration Lookup

```jsx
const config = statusConfig[entry.status];
const StatusIcon = config.icon;
```

This maps the status string ("completed", "cancelled", "no-show") to:
- A label ("Completed", "Cancelled", "No Show")
- An icon component (CheckCircle, XCircle, AlertCircle)
- A badge color class

---

# How to Connect to C++ Backend

## Step 1: Create an API Route

Create `app/api/history/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Call your C++ backend
  const response = await fetch('http://localhost:8080/api/history');
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

## Step 2: Create C++ Backend

Create a simple HTTP server in C++ (using cpp-httplib or similar):

```cpp
#include <httplib.h>
#include <json.hpp>

using json = nlohmann::json;

int main() {
    httplib::Server svr;
    
    svr.Get("/api/history", [](const httplib::Request&, httplib::Response& res) {
        json history = json::array({
            {
                {"id", "HST-2026-0089"},
                {"status", "completed"},
                {"appointmentDate", "Monday, March 10, 2026 — 9:00 AM"},
                {"reason", "Consultation"},
                {"outcome", "No issues found"}
            }
        });
        
        res.set_content(history.dump(), "application/json");
    });
    
    svr.listen("localhost", 8080);
}
```

## Step 3: Update History Page to Fetch Data

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, []);

  // Replace MOCK_HISTORY with history state
  // ... rest of the component
}
```

## Step 4: Compile and Run C++ Backend

```bash
g++ -o server server.cpp -lhttplib -lssl -lcrypto
./server
```

---

# Summary

| Current State | With Backend |
|--------------|--------------|
| `MOCK_HISTORY` (hardcoded) | Fetch from `/api/history` |
| Static data | Dynamic from C++ server |
| No loading state | Add loading/error states |