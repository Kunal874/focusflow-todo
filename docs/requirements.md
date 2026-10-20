# Assignment requirements

Source: the assignment supplied in chat on 21 October 2026. This document records its requirements and the checks we will use; it does not claim they have been implemented.

## Required

| Requirement | Acceptance check | Stage |
| --- | --- | --- |
| Android app built with React Native CLI and TypeScript | Native android project exists; app installs and opens on Android | 1, 8 |
| Register with email and password | New user can register; duplicate or invalid email is handled | 3, 5 |
| Log in with registered credentials | Correct credentials work; incorrect credentials show a useful error | 3, 5 |
| Add title, description, date-time, deadline, and priority | Each field is captured, validated, saved, and shown after reload | 4, 6 |
| Complete tasks | Marking complete persists; task status changes visibly | 4, 6 |
| Delete tasks | Confirmed deletion removes the task and stays removed after reload | 4, 6 |
| List tasks and their statuses | Pending and completed tasks are visibly distinguishable | 6 |
| Node.js or NestJS backend | Express runs on Node.js with documented endpoints | 2-4 |
| MongoDB task storage | Tasks persist in MongoDB and are scoped to the signed-in user | 2, 4 |
| State management | Auth and task contexts/reducers drive loading, data, and errors | 5, 6 |
| Appropriate UI controls | Inputs, accessible buttons, date/time pickers, and a FlatList | 5, 6 |
| Clean organization and important comments | Focused feature folders; comments explain non-obvious decisions | All |

## Selected bonus work

1. Distinguish scheduled date-time from the completion deadline.
2. Offer smart sorting that combines schedule, deadline, and priority.
3. Add status and priority filters, plus simple alternative sort orders.
4. Use a cohesive visual design, useful empty/error states, and accessible controls.
5. Support editing and reopening tasks.

Tags/categories, reminders, social sign-in, dark mode, and offline synchronization are possible later extensions. They are outside the first submission scope.

## Evaluation walkthrough

- Register account A and log out; log back in.
- Create three tasks with distinct priorities, schedules, and deadlines.
- Edit one, complete another, and delete the third.
- Restart the app and confirm the remaining tasks and statuses persist.
- Switch accounts and confirm account B cannot see or mutate account A's tasks.
- Demonstrate smart ranking and filters.
- Show invalid-form feedback, expired-session behavior, and recovery after a failed request.
- Install the final APK independently of Metro and repeat the core flow.

The original assignment does not supply a submission deadline, hosting credentials, or required APK signing/distribution method. We will settle delivery access and hosting during Stage 8 without assuming any paid service.
