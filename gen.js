(async () => {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');
    const { exec } = require("child_process");
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

    if (!(fs.existsSync(path.join("./input/")))) { fs.mkdirSync(path.join("./input/")) }
    if (!(fs.existsSync(path.join("./output/")))) { fs.mkdirSync(path.join("./output/")) }

    if (!(fs.existsSync(path.join("./Chara.xml")))) {
        console.log("No Template Chara.xml");
        process.exit(1);
    }
    if (!(fs.existsSync(path.join("./DDSImage.xml")))) {
        console.log("No Template DDSImage.xml");
        process.exit(1);
    }

    const workspaces = fs.readdirSync("./input/");

    const charaTemplate = await new Promise(ok => {
        xml2js.parseString((fs.readFileSync("./Chara.xml")).toString(), (err, result) => {
            if (err) {
                console.log('Error parsing XML:', err.message);
                ok(false);
            }
            ok(result);
        });
    })
    const ddsTemplate = await new Promise(ok => {
        xml2js.parseString((fs.readFileSync("./DDSImage.xml")).toString(), (err, result) => {
            if (err) {
                console.log('Error parsing XML:', err.message);
                ok(false);
            }
            ok(result);
        });
    })

    const nvcompReady = (fs.existsSync(path.join("C:\\Program Files\\NVIDIA Corporation\\NVIDIA Texture Tools\\", "nvcompress.exe")))

    if (nvcompReady) {
        console.log("NVIDIA Texture Tools are found!")
    }

    function padToFourCharacters(input) {
        return input.toString().padStart(4, '0');
    }
    function buildDDSImageXML(id, k = 0) {
        let d = ddsTemplate;
        let fn = Object.keys(ddsTemplate);

        d[fn]['dataName'] = [`ddsImage0${padToFourCharacters(id)}${k}`];
        d[fn]['name'] = [{
            "id": [`${id}${k}`],
            "str": [`chara${padToFourCharacters(id)}_0${k}`],
            "data": ['']
        }]
        for (let i = 0; i <= 2; i++) {
            d[fn][`ddsFile${i}`][0]['path'] = [`CHU_UI_Character_${padToFourCharacters(id)}_0${k}_0${i}.dds`]
        }
        return JSON.parse(JSON.stringify(d));
    }
    async function buildChara(workspace) {
        console.log(`Compile: ${workspace}`);
        if (!(fs.existsSync(path.join("./output/", workspace)))) {
            fs.mkdirSync(path.join("./output/", workspace))
        }
        if (!(fs.existsSync(path.join("./output/", workspace, "chara/")))) { fs.mkdirSync(path.join("./output/", workspace, "/chara/")) }
        if (!(fs.existsSync(path.join("./output/", workspace, "/ddsImage/")))) { fs.mkdirSync(path.join("./output/", workspace, "/ddsImage/")) }
        const charaFiles = fs.readdirSync(path.join("./input", workspace));
        for (const chara of charaFiles) {
            console.log(`- Processing Chara: ${chara}`);
            const meta = JSON.parse((fs.readFileSync(path.join("./input", workspace, chara, "meta.json"))).toString());
            console.log(meta)
            let template = charaTemplate
            if (fs.existsSync(path.join("./input", workspace, chara, "Chara.xml"))) {
                const _charaTemplate = await new Promise(ok => {
                    xml2js.parseString((fs.readFileSync(path.join("./input", workspace, chara, "Chara.xml"))).toString(), (err, result) => {
                        if (err) {
                            console.log('Error parsing XML:', err.message);
                            ok(false);
                        } else {
                            ok(result);
                        }
                    });
                })
                if (_charaTemplate) {
                    console.log(`- - Using Template File`);
                    template = _charaTemplate;
                }
            }
            let id = 0;
            let fn = Object.keys(template);
            let c = template;
            const nodes = Object.keys(meta);

            let imagesXML = [];

            nodes.map(k => {
                switch (k) {
                    case "id":
                        c[fn]['name'][0]['id'] = [meta[k] + '0'];
                        id = meta[k];
                        console.log(`- - ID: ${id}`);
                        break;
                    case "name":
                        c[fn]['name'][0]['str'] = [meta[k]];
                        console.log(`- - Name: ${meta[k]}`);
                        break;
                    case "sort":
                        c[fn]['sortName'] = [meta["sort"]];
                        console.log(`- - Sort: ${meta['sort']}`);
                        break;
                    case "works":
                        c[fn]['works'][0]['id'] = [meta.works.id.toString()];
                        c[fn]['works'][0]['str'] = [meta.works.name.toString()];
                        console.log(`- - Works: ${meta.works.name} (${meta.works.id})`);
                        break;
                    case "illustrator":
                        c[fn]['illustratorName'][0]['id'] = [meta.illustrator.id.toString()];
                        c[fn]['illustratorName'][0]['str'] = [meta.illustrator.name.toString()];
                        console.log(`- - Illustrator: ${meta.illustrator.name} (${meta.illustrator.id})`);
                        break;
                    case "default":
                        c[fn]['defaultHave'] = [(!!meta[k]).toString()];
                        console.log(`- - Default Have?: ${(!!meta[k]).toString().toUpperCase()}`);
                        break;
                    default:
                        break;
                }
            })
            c[fn]['dataName'] = [`chara0${padToFourCharacters(id)}0`];
            c[fn]['ranks'][0]["CharaRankData"] = [];
            if (meta['rewards'] && meta['rewards'].length > 0) {
                console.log(`- - Rewards: ${meta['rewards'].length}`);
                meta['rewards'].map(rew => {
                    const levels = rew["levels"];
                    c[fn]['ranks'][0]["CharaRankData"].push(...levels.map(l => {
                        return {
                            "index": [l.toString()],
                            "type": [rew["type"].toString()],
                            "rewardSkillSeed":[
                                {"rewardSkillSeed":[
                                        {
                                            "id":[rew["id"].toString()],
                                            "str":[rew["name"].toString()],
                                            "data":[""]
                                        }
                                    ]}
                            ],
                            "text":[{"flavorTxtFile":[{"path":[""]}]}]
                        }
                    }))
                })
            }

            const numOfTransforms = (meta.transforms && meta.transforms.length > 0) ? meta.transforms.length  + 1 : 1

            console.log(`- - Transforms: ${numOfTransforms}`);
            for (let i = 1; i <= 9; i++) {
                c[fn]['addImages' + i] = [{
                    changeImg: [false],
                    charaName: [{
                        "id": ['-1'],
                        "str": ["Invalid"],
                        "data": ['']
                    }],
                    image: [{
                        "id": ['-1'],
                        "str": ["Invalid"],
                        "data": ['']
                    }],
                    "rank": ['1']
                }]
            }
            c[fn]['defaultImages'] = [{
                "id": [`${id}0`],
                "str": [`chara${padToFourCharacters(id)}_00`],
                "data": ['']
            }]
            const ddsFile = buildDDSImageXML(id, 0);
            imagesXML.push(ddsFile)

            if (numOfTransforms > 1) {
                for (let i = 1; i <= meta.transforms.length; i++) {
                    c[fn]['addImages' + i] = [{
                        changeImg: [true],
                        charaName: [{
                            "id": [`${id}${i}`],
                            "str": [meta.transforms[i - 1].name],
                            "data": ['']
                        }],
                        image: [{
                            "id": [`${id}${i}`],
                            "str": [`chara${padToFourCharacters(id)}_0${i}`],
                            "data": ['']
                        }],
                        rank: [meta.transforms[i - 1].rank]
                    }]
                    const ddsImage = buildDDSImageXML(id, i)
                    imagesXML.push(ddsImage)
                }
            }

            if (!(fs.existsSync(path.join("./output/", workspace, "/chara/", `chara0${padToFourCharacters(id)}0`)))) {
                fs.mkdirSync(path.join("./output/", workspace, "/chara/", `chara0${padToFourCharacters(id)}0`))
            }

            const builder = new xml2js.Builder();
            const charaXML = builder.buildObject(c);
            fs.writeFileSync(path.join("./output/", workspace, "/chara/", `chara0${padToFourCharacters(id)}0`, 'Chara.xml'), charaXML.replaceAll('/>', ' />').toString(), {encoding: "utf8"});

            const ddsFolders = fs.readdirSync(path.join("./input", workspace, chara));
            if (meta.flat) {
                console.log(`- - - Reading as flat directory`);
            } else {
                console.log(`- - - Reading as directories`);
            }
            for (const i in imagesXML) {
                const img = imagesXML[i];
                if (!(fs.existsSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`)))) {
                    fs.mkdirSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`))
                }
                const builder = new xml2js.Builder();
                const ddsImageXML = builder.buildObject(img);

                fs.writeFileSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, 'DDSImage.xml'), ddsImageXML.replaceAll('/>', ' />').toString(), {encoding: "utf8"});

                if (meta.flat) {
                    console.log(`- - - - Copy Image Set ${i}`);
                    for (let g = 0; g <= 2; g++) {
                        if (fs.existsSync(path.join("./input", workspace, chara, `${i}${g}.dds`))) {
                            fs.copyFileSync(path.join("./input", workspace, chara, `${i}${g}.dds`), path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, `CHU_UI_Character_${padToFourCharacters(id)}_0${i}_0${g}.dds`))
                        } else if (nvcompReady && fs.existsSync(path.join("./input", workspace, chara, `${i}${g}.png`))) {
                            console.log(`- - - - Converting ${i}${g}`);
                            fs.copyFileSync(path.join("./input", workspace, chara, `${i}${g}.png`), path.join("./", "temp.png"))
                            const conv = await new Promise((resolve, reject) => {
                                const args = [
                                    `"${path.resolve(path.join("C:\\Program Files\\NVIDIA Corporation\\NVIDIA Texture Tools\\", "nvcompress.exe"))}"`,
                                    '-color',
                                    '-nomips',
                                    '-highest',
                                    '-bc3',
                                    '"' + path.resolve(path.join("./", "temp.png")) + '"',
                                    '"' + path.resolve(path.join("./", "temp.dds")) + '"'
                                ].join(" ");
                                exec(args, (error, stdout, stderr) => {
                                    if (error) {
                                        console.error(`exec error: ${error}`);
                                        console.error(stderr);
                                        return;
                                    }
                                    if (fs.existsSync(path.resolve(path.join("./", "temp.png")))) {
                                        fs.unlinkSync(path.resolve(path.join("./", "temp.png")))
                                    }
                                    console.log(stdout);
                                    resolve(!error)
                                });
                            });
                            if (!conv || !(fs.existsSync(path.resolve(path.join("./", "temp.dds"))))) {
                                console.error("Failed to generate file!");
                            } else {
                                fs.renameSync(path.resolve(path.join("./", "temp.dds")), path.resolve(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, `CHU_UI_Character_${padToFourCharacters(id)}_0${i}_0${g}.dds`)))
                            }
                        } else {
                            console.error(`- - - - Missing Image ${i}${g}`);
                        }
                    }
                } else {
                    console.log(`- - - - Copy Image Set ${i}`);
                    const imageFiles = fs.readdirSync(path.join("./input", workspace, chara, ddsFolders[i]))
                    for (let fi in imageFiles) {
                        const file = imageFiles[fi];
                        if (fs.existsSync(path.join("./input", workspace, chara, ddsFolders[i], file))) {
                            fs.copyFileSync(path.join("./input", workspace, chara, ddsFolders[i], file), path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, `CHU_UI_Character_${padToFourCharacters(id)}_0${i}_0${fi}.dds`))
                        } else if (nvcompReady && fs.existsSync(path.join("./input", workspace, chara, ddsFolders[i], file.replace(".dds",".png")))) {
                            console.log(`- - - - Converting ${ddsFolders[i]}/${i}`);
                            fs.copyFileSync(path.join("./input", workspace, chara, ddsFolders[i], file.replace(".dds",".png")), path.join("./", "temp.png"))
                            const conv = await new Promise((resolve, reject) => {
                                const args = [
                                    `"${path.resolve(path.join("C:\\Program Files\\NVIDIA Corporation\\NVIDIA Texture Tools\\", "nvcompress.exe"))}"`,
                                    '-color',
                                    '-nomips',
                                    '-highest',
                                    '-bc3',
                                    '"' + path.resolve(path.join("./", "temp.png")) + '"',
                                    '"' + path.resolve(path.join("./", "temp.dds")) + '"'
                                ].join(" ");
                                exec(args, (error, stdout, stderr) => {
                                    if (error) {
                                        console.error(`exec error: ${error}`);
                                        console.error(stderr);
                                        return;
                                    }
                                    if (fs.existsSync(path.resolve(path.join("./", "temp.png")))) {
                                        fs.unlinkSync(path.resolve(path.join("./", "temp.png")))
                                    }
                                    console.log(stdout);
                                    resolve(!error);
                                });
                            });
                            if (!conv || !(fs.existsSync(path.resolve(path.join("./", "temp.dds"))))) {
                                console.error("Failed to generate file!");
                            } else {
                                fs.renameSync(path.resolve(path.join("./", "temp.dds")), path.resolve(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, `CHU_UI_Character_${padToFourCharacters(id)}_0${i}_0${g}.dds`)))
                            }
                        } else {
                            console.error(`- - - - Missing Image ${ddsFolders[i]}/${i}`);
                        }
                    }
                }
            }
        }
    }

    for (const w of workspaces) {
        console.log("Starting Compiler...");
        await buildChara(w);
    }
    await sleep(5000);
})()
