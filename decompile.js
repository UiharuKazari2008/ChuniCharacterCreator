(async () => {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

    if (!(fs.existsSync(path.join("./import/")))) { fs.mkdirSync(path.join("./import/")) }
    if (!(fs.existsSync(path.join("./decompiled/")))) { fs.mkdirSync(path.join("./decompiled/")) }

    const workspaces = fs.readdirSync("./import/");

    function padToTwoCharacters(input) {
        return input.toString().padStart(2, '0');
    }
    function padToFiveCharacters(input) {
        return input.toString().padStart(6, '0');
    }

    async function buildChara(workspace) {
        console.log(`Compile: ${workspace}`);
        let conId = null;
        let defaults = {};
        if (fs.existsSync(path.join("./import/", workspace, "/config.json"))) {
            const con = JSON.parse((fs.readFileSync(path.join("./import/", workspace, "/config.json"))).toString());
            console.log(`Using Configuration File`, con);
            if (con.id) { conId = con.id; }
            if (con.works) { defaults.works = con.works; }
            if (con.default) { defaults.default = con.default; }
        }
        if (!(fs.existsSync(path.join("./decompiled/", workspace)))) { fs.mkdirSync(path.join("./decompiled/", workspace)) }
        const charaFiles = fs.readdirSync(path.join("./import", workspace, "/chara/"));
        for (const chara of charaFiles) {
            const c = await new Promise(ok => {
                xml2js.parseString((fs.readFileSync(path.join("./import", workspace, "/chara/", chara, "/Chara.xml"))).toString(), (err, result) => {
                    if (err) {
                        console.log('Error parsing XML:', err.message);
                        ok(false);
                    }
                    ok(result);
                });
            })
            let meta = {};
            if (c) {
                console.log(`- Processing Chara: ${chara}`);
                let fn = Object.keys(c);
                if (c[fn]['disableFlag'][0].toLowerCase() === 'false') {
                    if (conId) {
                        meta.id = conId;
                        meta.org_id = parseInt(c[fn]['name'][0]['id'][0].slice(0, -1));
                        console.log(`- - ID: ${meta.id} (Original: ${meta.org_id})`);
                        conId++;
                    } else {
                        meta.id = parseInt(c[fn]['name'][0]['id'][0].slice(0, -1));
                        console.log(`- - ID: ${meta.id}`);
                    }
                    meta.name = c[fn]['name'][0]['str'][0];
                    console.log(`- - Name: ${meta.name}`);
                    meta.sort = c[fn]['sortName'][0];
                    meta.works = {}
                    if (defaults.works) {
                        meta.works = defaults.works;
                    } else {
                        meta.works.id = parseInt(c[fn]['works'][0]['id'][0]);
                        meta.works.name = c[fn]['works'][0]['str'][0];
                    }
                    console.log(`- - Works: ${meta.works.name} (${meta.works.id})`);
                    if (defaults.default) {
                        meta.default = defaults.default;
                    } else {
                        meta.default = (c[fn]['defaultHave'][0].toLowerCase() === 'true');
                    }
                    console.log(`- - Default Have?: ${meta.default.toString().toUpperCase()}`);
                    meta.flat = true;

                    if (!(fs.existsSync(path.join("./decompiled/", workspace, meta.name)))) { fs.mkdirSync(path.join("./decompiled/", workspace, meta.name)) }

                    const defId = c[fn]['defaultImages'][0]['id'][0];
                    let image = path.join("./import", workspace, "/ddsImage/", `ddsImage${padToFiveCharacters(defId)}`);
                    if (!(fs.existsSync(path.join("./import", workspace, "/ddsImage/", `ddsImage${padToFiveCharacters(defId)}`, "/ddsImage.xml")))) {
                        image = path.join("./ddsImage/", `ddsImage${padToFiveCharacters(defId)}`)
                    }
                    const defaultImage = {
                        id: defId,
                        path: image,
                        file: (await new Promise(async res => {
                            const d = await new Promise(ok => {
                                xml2js.parseString((fs.readFileSync(path.join(image, "/ddsImage.xml"))).toString(), (err, result) => {
                                    if (err) {
                                        console.log('Error parsing XML:', err.message);
                                        ok(false);
                                    }
                                    ok(result);
                                });
                            })
                            let images = [];
                            let dfn = Object.keys(d);
                            for (let i = 0; i <= 2; i++) {
                                images.push(d[dfn]['ddsFile0'][0]['path'][0]);
                            }
                            res(images)
                        }))
                    };
                    defaultImage.file.map((fil, ind) => {
                        fs.copyFileSync(path.join(defaultImage.path, fil), path.join("./decompiled/", workspace, meta.name, `0${ind}.dds`))
                    })
                    console.log(`- - Default Image: ${defaultImage.id} (${defaultImage.path})`);

                    const transforms = [];
                    for (let i = 1; i <= 9; i++) {
                        if (c[fn]['addImages' + i][0]['changeImg'][0].toLowerCase() === 'true') {
                            const defId = c[fn]['addImages' + i][0]['image'][0]['id'][0];
                            let imageFile = path.join("./import", workspace, "/ddsImage/", `ddsImage${padToFiveCharacters(defId)}`);
                            if (!(fs.existsSync(path.join("./import", workspace, "/ddsImage/", `ddsImage${padToFiveCharacters(defId)}`, "/ddsImage.xml")))) {
                                imageFile = path.join("./ddsImage/", `ddsImage${padToFiveCharacters(defId)}`)
                            }
                            const imgObj = {
                                id: defId.slice(0, -1),
                                name: c[fn]['addImages' + i][0]['charaName'][0]['str'][0],
                                rank: c[fn]['addImages' + i][0]['rank'][0],
                                path: imageFile,
                                file: (await new Promise(async res => {
                                    const d = await new Promise(ok => {
                                        xml2js.parseString((fs.readFileSync(path.join(imageFile, "/ddsImage.xml"))).toString(), (err, result) => {
                                            if (err) {
                                                console.log('Error parsing XML:', err.message);
                                                ok(false);
                                            }
                                            ok(result);
                                        });
                                    })
                                    let images = [];
                                    let dfn = Object.keys(d);
                                    for (let i = 0; i <= 2; i++) {
                                        images.push(d[dfn]['ddsFile0'][0]['path'][0]);
                                    }
                                    res(images)
                                }))
                            }
                            imgObj.file.map((fil, ind) => {
                                fs.copyFileSync(path.join(imgObj.path, fil), path.join("./decompiled/", workspace, meta.name, `${i}${ind}.dds`))
                            })
                            transforms.push({
                                name: imgObj.name,
                                rank: imgObj.rank
                            })
                            console.log(`- - - Transform Image #${i}: ${imgObj.name}@${imgObj.rank} // ${imgObj.id} (${imgObj.path})`);
                        } else {
                            i = 100;
                        }
                    }
                    if (transforms.length > 0) {
                        meta.transforms = transforms;
                    }

                    fs.writeFileSync(path.join("./decompiled/", workspace, meta.name, `meta.json`), JSON.stringify(meta, undefined, 2), { encoding: "utf8" })
                } else {
                    console.error(`- Skipping Chara (Disabled Flag): ${chara}`);
                }
            } else {
                console.error(`Invalid Chara XML Data: ${chara}`);
            }
        }
    }

    for (const w of workspaces) {
        console.log("Starting Decompiler...");
        await buildChara(w);
    }
    await sleep(5000);

})()
