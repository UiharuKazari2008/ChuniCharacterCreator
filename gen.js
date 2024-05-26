(async () => {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');

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
    function buildChara(workspace) {
        if (!(fs.existsSync(path.join("./output/", workspace)))) {
            fs.mkdirSync(path.join("./output/", workspace))
        }
        if (!(fs.existsSync(path.join("./output/", workspace, "chara/")))) { fs.mkdirSync(path.join("./output/", workspace, "/chara/")) }
        if (!(fs.existsSync(path.join("./output/", workspace, "/ddsImage/")))) { fs.mkdirSync(path.join("./output/", workspace, "/ddsImage/")) }
        (fs.readdirSync(path.join("./input", workspace))).map(chara => {
            const meta = JSON.parse((fs.readFileSync(path.join("./input", workspace, chara, "meta.json"))).toString());
            console.log(meta)
            let id = 0;
            let fn = Object.keys(charaTemplate);
            let c = charaTemplate;
            const nodes = Object.keys(meta);

            let imagesXML = [];

            nodes.map(k => {
                switch (k) {
                    case "id":
                        c[fn]['name'][0]['id'] = [meta[k] + '0'];
                        id = meta[k];
                        break;
                    case "name":
                        c[fn]['name'][0]['str'] = [meta[k]];
                        break;
                    case "sortName":
                        c[fn]['sortName'] = [meta[k]];
                        break;
                    case "works":
                        c[fn]['works'][0]['id'] = [meta.works.id.toString()];
                        c[fn]['works'][0]['str'] = [meta.works.name.toString()];
                        break;
                    case "illustrator":
                        c[fn]['illustratorName'][0]['id'] = [meta.illustrator.id.toString()];
                        c[fn]['illustratorName'][0]['str'] = [meta.illustrator.name.toString()];
                        break;
                    case "default":
                        c[fn]['defaultHave'] = [(!!meta[k]).toString()];
                        break;
                    default:
                        break;
                }
            })
            c[fn]['dataName'] = [`chara0${padToFourCharacters(id)}0`];
            c[fn]['ranks'][0]["CharaRankData"] = [];
            if (meta['rewards'] && meta['rewards'].length > 0) {
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

            const numOfTransforms = (fs.readdirSync(path.join("./input", workspace, chara)).filter(f => (fs.statSync(path.join("./input", workspace, chara, f))).isDirectory())).length

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
            imagesXML.map((img, i) => {
                if (!(fs.existsSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`)))) {
                    fs.mkdirSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`))
                }
                const builder = new xml2js.Builder();
                const ddsImageXML = builder.buildObject(img);

                fs.writeFileSync(path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, 'DDSImage.xml'), ddsImageXML.replaceAll('/>', ' />').toString(), {encoding: "utf8"});

                fs.readdirSync(path.join("./input", workspace, chara, ddsFolders[i])).map((file,fi) => {
                    fs.copyFileSync(path.join("./input", workspace, chara, ddsFolders[i], file), path.join("./output/", workspace, "/ddsImage/", `ddsImage0${padToFourCharacters(id)}${i}`, `CHU_UI_Character_${padToFourCharacters(id)}_0${i}_0${fi}.dds`))
                })
            })
        })
    }

    workspaces.map(w => {
        buildChara(w)
    })

})()
