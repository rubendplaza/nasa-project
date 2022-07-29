const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const planets = require("./planets.mongo");
const { get } = require("http");

const LIGHT_LEVEL_LOWER_LIMIT = 0.36;
const LIGHT_LEVEL_UPPER_LIMIT = 1.11;
const PLANT_RADIUS_UPPER_LIMIT = 1.6;

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(
            path.join(__dirname, "..", "..", "data", "kepler_data.csv")
        )
            .pipe(
                parse({
                    comment: "#",
                    columns: true,
                })
            )
            .on("data", async (data) => {
                // parse is emitting row by row, each piece of data is a JS object with key value pairs.
                if (isHabitablePlanet(data)) {
                    savePlanet(data);
                }
            })
            .on("end", async () => {
                const countPlanetsFound = (await getAllPlanets()).length;
                console.log(`${countPlanetsFound} habitable planets found.`);
                resolve();
            })
            .on("error", (err) => {
                console.log(err);
                reject(err);
            });
    });
}

function isHabitablePlanet(planet) {
    return (
        planet["koi_disposition"] === "CONFIRMED" &&
        planet["koi_insol"] > LIGHT_LEVEL_LOWER_LIMIT &&
        planet["koi_insol"] < LIGHT_LEVEL_UPPER_LIMIT &&
        planet["koi_prad"] < PLANT_RADIUS_UPPER_LIMIT
    );
}

async function getAllPlanets() {
    return await planets.find(
        {},
        {
            _id: 0,
            __v: 0,
        }
    );
}

async function savePlanet(planet) {
    try {
        await planets.updateOne(
            {
                keplerName: planet.kepler_name,
            },
            {
                keplerName: planet.kepler_name,
            },
            {
                upsert: true,
            }
        );
    } catch (err) {
        console.error("Could not save planet", err);
    }
}

module.exports = {
    loadPlanetsData,
    getAllPlanets,
};
