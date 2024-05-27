(async () => {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

    const workspaces = fs.readdirSync("./input/");

    let commands = [];
    function readCharas(workspace) {
        console.log(`Proccess: ${workspace}`);
        const charaFiles = fs.readdirSync(path.join("./input", workspace));
        for (const chara of charaFiles) {
            console.log(`- Processing Chara: ${chara}`);
            const meta = JSON.parse((fs.readFileSync(path.join("./input", workspace, chara, "meta.json"))).toString());
            if (meta && meta.org_id) {
                commands.push(`UPDATE aime.chuni_item_character SET characterId = '${meta.id}' WHERE user = INVALID AND characterId = '${meta.org_id}';`);
            }
        }
    }

    for (const w of workspaces) {
        console.log("Starting Migrator...");
        await readCharas(w);
    }
    fs.writeFileSync("./migrate.sql", commands.join('\n'), { encoding: 'utf8' });
    await sleep(5000);
})()
