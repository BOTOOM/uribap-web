# Feature Specification: Complete Ingredient Listings

**Feature Branch**: `devin/1791307670-ingredient-pagination`

**Created**: 2026-10-06

**Status**: Draft

**Input**: Ensure household ingredients remain complete and correctly identified throughout the ingredient catalog, inventory, weekly plan, preparation, and recipe views, even when a household has a large catalog.

## User Scenarios & Testing

### User Story 1 - See the complete household ingredient catalog (Priority: P1)

A household member opens the ingredient catalog or inventory and can see every ingredient available to that household, including when the catalog is larger than 100 items.

**Why this priority**: Missing catalog entries make inventory management incomplete and can cause users to mistake a real ingredient for an unnamed item.

**Independent Test**: Provide a household with 140 visible ingredients, open the catalog and inventory, and verify every ingredient appears exactly once with its correct name.

**Acceptance Scenarios**:

1. **Given** a household has 140 visible ingredients, **When** a member opens the ingredient catalog, **Then** all 140 are available without omissions or duplicates.
2. **Given** a household has 140 visible ingredients, **When** a member opens inventory, **Then** each listed ingredient retains its correct name instead of falling back to a generic label.
3. **Given** the household has no visible ingredients, **When** a member opens either page, **Then** its existing empty state is shown.

### User Story 2 - See correct ingredient names in meal and recipe views (Priority: P1)

A household member inspects a planned meal, preparation, or recipe and sees the correct name and details for each ingredient used by that view, even when that ingredient is beyond the first 100 catalog items.

**Why this priority**: Meal and recipe decisions depend on recognizing the actual ingredients; a missing lookup entry can silently hide an ingredient or show a generic fallback.

**Independent Test**: Use an ingredient from beyond the first 100 catalog entries in a recipe, plan entry, and preparation view, then verify each view resolves and displays its correct name.

**Acceptance Scenarios**:

1. **Given** a recipe uses an ingredient beyond the first 100 catalog entries, **When** a member opens the recipe, **Then** the ingredient is displayed with its correct name.
2. **Given** a planned or prepared meal uses an ingredient beyond the first 100 catalog entries, **When** a member opens its detail, **Then** the ingredient is displayed with its correct name and existing details.
3. **Given** a member has chosen search or filters, **When** more matching ingredients are loaded, **Then** the same choices and household visibility apply to every result.

### Edge Cases

- The catalog ends with fewer than 100 ingredients remaining, is empty, or ends exactly at a batch boundary.
- The catalog changes while additional results are being loaded; completeness is guaranteed for an unchanged catalog, not as a historical snapshot.
- A later batch fails; the page must retain its existing error behavior rather than silently present an incomplete catalog.
- Existing search and filter choices must remain intact while more results are loaded.

## Requirements

### Functional Requirements

- **FR-001**: The ingredient catalog and inventory MUST make every ingredient visible to the active household available, including catalogs containing more than 100 ingredients.
- **FR-002**: Each ingredient MUST appear no more than once in a complete listing, and views MUST retain the ingredient's correct name and existing details.
- **FR-003**: Meal-plan, preparation, and recipe views MUST resolve ingredient names from the complete visible catalog rather than silently substituting a generic name when the ingredient exists.
- **FR-004**: Existing search, dimension, global-ingredient, and household-visibility filters MUST remain effective throughout a continued listing.
- **FR-005**: A listing MUST be considered complete only after all matching ingredients have been obtained; a failure while loading more results MUST use the page's existing error behavior rather than silently presenting partial results as complete.
- **FR-006**: Loading, empty, error, and permission behavior MUST remain consistent with each page's existing behavior.
- **FR-007**: Household-private ingredient information MUST remain protected by existing household access controls.

### Key Entities

- **Ingredient**: A household or global catalog item whose identity, name, and details are used by inventory, planning, preparation, and recipe views.
- **Ingredient listing**: A complete, ordered view of the ingredients visible to the household; it does not create or persist new household data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: With 140 visible ingredients, the ingredient catalog and inventory each expose all 140 exactly once.
- **SC-002**: Ingredients positioned after the first 100 results show their correct names in the catalog, inventory, plan, preparation, and recipe views that use them.
- **SC-003**: For an unchanged catalog, a complete listing has zero missing or duplicate ingredients.
- **SC-004**: Existing filters and household/global visibility remain unchanged across all continuation requests.
- **SC-005**: If a page request fails during continuation, the shared helper rejects instead of returning a partial list, and each page loader retains its existing failure behavior.

## Assumptions

- A backend update is delivered before this Web work and provides stable continuation information for an unchanged catalog.
- Existing household access controls remain in place for all five views.
- Members do not need to manually request each batch of ingredients.
- Ingredient catalog changes while a complete listing is being gathered do not require snapshot isolation.

## Out of Scope

- Changing backend ingredient-listing behavior, ingredient persistence, inventory calculations, or shopping calculations.
- Adding user-operated pagination controls.
- Changing the ingredient-create POST route or adding ingredient mutations.
- Reworking the visual design of the five pages beyond displaying the complete, correctly resolved ingredient data.
