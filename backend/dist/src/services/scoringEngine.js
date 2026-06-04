"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePlace = scorePlace;
exports.rankPlaces = rankPlaces;
function scorePlace(place, params) {
    let score = 0;
    if (place.budgetLevel === params.budget) {
        score += 3;
    }
    for (const tag of params.tags) {
        if (place.tags.includes(tag)) {
            score += 2;
        }
    }
    score += place.rating;
    return score;
}
function rankPlaces(places, params) {
    return [...places].sort((a, b) => scorePlace(b, params) - scorePlace(a, params));
}
