# PMO / Planning Workspace Specification

Last updated: 2026-03-19  
Applies to: TeksyDPR PMO module

## 1. Purpose

PMO workspace is the planning control engine of the portal.  
The core working surface is an MSP-style schedule grid (not modal-first planning forms).

Primary planner outcomes:

- Build hierarchy (WBS + segment/floor mapping)
- Create and maintain logic-driven schedule
- Manage Baseline 1 / 2 / 3
- Compare baseline vs current vs actual
- Detect slippages and generate look-ahead actions

## 2. Final PMO Module Structure

The PMO module shall expose these 10 sections:

1. Planning Dashboard
2. Project Planning Setup
3. WBS / Activities
4. Floors / Segments
5. Schedule Builder
6. Targets & Baselines
7. Progress Monitoring
8. Variance Analysis
9. Planning Reports
10. Revision / Change Log

## 3. Current Implementation Snapshot (already done)

- PMO route shell and navigation for all 10 sections.
- WBS / Activities section wired to governance masters:
  - activity library
  - WBS templates
  - delay reasons
  - hindrance master
- Schedule Builder page implemented as Phase-1 MSP-style foundation:
  - project selection
  - baseline slot (B1/B2/B3) selection
  - baseline capture
  - editable planning grid for schedule rows
  - baseline finish variance indicator

## 4. Schedule Builder: Core UX Contract

### 4.1 Screen layout

- Top ribbon/action bar
- Main editable schedule grid
- Optional side/bottom detail panel

### 4.2 Top ribbon actions (target state)

- Add Activity
- Delete Activity
- Indent
- Outdent
- Link Tasks
- Unlink Tasks
- Set Milestone
- Save
- Save Revision
- Set Baseline 1
- Set Baseline 2
- Set Baseline 3
- Compare Baseline
- Import
- Export
- Filter
- View
- Recalculate

### 4.3 Required grid columns (target state)

- Row No.
- Activity ID
- WBS Code
- Activity Name
- Parent Activity
- Indent Level
- Activity Type
- Domain / Segment / Floor
- Trade / Category
- Unit
- Planned Quantity
- Duration
- Start Date
- Finish Date
- Predecessors
- Successors
- Constraint Type
- Constraint Date
- Baseline 1 Start
- Baseline 1 Finish
- Baseline 1 Duration
- Baseline 2 Start
- Baseline 2 Finish
- Baseline 2 Duration
- Baseline 3 Start
- Baseline 3 Finish
- Baseline 3 Duration
- Actual Start
- Actual Finish
- Current Status
- % Complete
- Delay Days
- Remarks

### 4.4 Interaction rules

- Inline editing is default behavior.
- Keyboard movement across grid cells should be supported.
- Row selection supports multi-row operations.
- First columns (WBS + Activity Name) should be frozen.
- Summary rows should support collapse/expand.

## 5. Planning Logic and Scheduling Rules

### 5.1 Predecessor grammar (MSP-style)

Accepted examples:

- `10FS`
- `10SS`
- `15FF+2d`
- `20FS-1d`

### 5.2 Relationship types

- FS: Finish to Start
- SS: Start to Start
- FF: Finish to Finish
- SF: Start to Finish

### 5.3 Recalculate behavior

On save/recalculate:

- Validate predecessor task IDs
- Reject circular dependency
- Recompute start/finish from logic + duration
- Mark impacted downstream tasks
- Flag dependency errors in-row

## 6. Baseline Architecture

### 6.1 Baseline model

- Baseline 1: Original approved plan
- Baseline 2: First approved revision
- Baseline 3: Later approved revision/recovery plan

### 6.2 Baseline snapshots per activity

For each baseline store:

- start
- finish
- duration
- quantity
- predecessor expression snapshot

### 6.3 Baseline actions

- Set B1/B2/B3 from current schedule
- Lock baseline with revision metadata
- Compare current vs selected baseline

### 6.4 Required variance outputs

- Start variance
- Finish variance
- Duration variance
- Quantity variance
- Completion variance

## 7. Actual Tracking Rules

Actual fields should not be manual-first.

- `actual_start`: first approved progress date from DPR/progress
- `actual_finish`: date cumulative approved progress reaches completion
- Manual override allowed only for PMO Manager/Admin with reason logging

## 8. Section Responsibilities

### Planning Dashboard

- Planning health KPIs, slippage indicators, look-ahead demand

### Project Planning Setup

- Project calendar, domain/subtype, planning frame, milestones, ownership

### WBS / Activities

- Hierarchy structure, task classification, trade/category assignment

### Floors / Segments

- Segment/floor hierarchy management and activity mapping

### Schedule Builder

- Primary planner workbench for logic-driven schedule authoring

### Targets & Baselines

- Target distribution and baseline governance

### Progress Monitoring

- Schedule-linked planned vs actual tracking

### Variance Analysis

- Baseline/current/actual variance diagnostics

### Planning Reports

- Activity/WBS/schedule/baseline variance and look-ahead outputs

### Revision / Change Log

- Complete planning audit trail including logic/date/hierarchy changes

## 9. Backend Extension Blueprint

Existing backend planning foundation remains valid and should be extended (not replaced).

### 9.1 Fields needed in schedule/planning entities

- parent_activity_id
- hierarchy_level
- display_sequence
- wbs_code
- task_type (summary/task/milestone)
- predecessor_expression
- successor_expression (stored or derived)
- duration_days
- constraint_type
- constraint_date
- baseline1_start, baseline1_finish, baseline1_duration
- baseline2_start, baseline2_finish, baseline2_duration
- baseline3_start, baseline3_finish, baseline3_duration
- actual_start, actual_finish
- planned_percent, actual_percent

### 9.2 Additional tables

- schedule_dependency_links
- schedule_baseline_history
- schedule_revision_headers
- schedule_revision_lines
- schedule_change_log
- project_calendars
- holiday_calendar

### 9.3 API capability targets

- Grid CRUD APIs (bulk-friendly)
- Recalculate endpoint
- Baseline set/compare endpoints
- Revision create/approve endpoints
- Actual sync endpoint from DPR approvals
- Change log query endpoint

## 10. Delivery Plan

### PMO-1

- Project Planning Setup
- WBS hierarchy
- Grid editing (indent/outdent, duration, start/finish)
- Predecessor input and recalculate

### PMO-2

- Baseline 1/2/3 formalization
- Revision control
- Delay indicators
- Actual start/finish sync from approved DPR

### PMO-3

- Look-ahead generation
- Variance dashboards
- Planning reports
- Import/export

### PMO-4

- Timeline/Gantt
- Advanced calendars and constraints
- Dependency visual editor

## 11. Acceptance Criteria (minimum)

- Planner can maintain hierarchy via indent/outdent inside grid.
- Planner can enter predecessor expressions and trigger recalculation.
- Planner can set B1/B2/B3 and compare against current dates.
- System auto-populates actual start/finish from approved DPR progress.
- Variance columns and delayed-task filters are available.
- All key changes are captured in revision/change log.
