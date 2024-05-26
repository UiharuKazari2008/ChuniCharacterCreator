# ChuniCharacterCreator
Generate Chunithm Character XML with support for Transforms

## Folder Structure
```powershell
    Directory: C:\Users\ykaza\IdeaProjects\ChuniCharacterCreator\input\ANKE\Snow White


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        2024/05/26      7:30                0
d-----        2024/05/26      7:30                1
-a----        2024/05/26      7:47            521 meta.json


    Directory: C:\Users\ykaza\IdeaProjects\ChuniCharacterCreator\input\ANKE\Snow White\0


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2024/04/20      9:14        1166528 00.dds
-a----        2024/04/20      9:14         262272 01.dds
-a----        2024/04/20      9:14          16512 02.dds


    Directory: C:\Users\ykaza\IdeaProjects\ChuniCharacterCreator\input\ANKE\Snow White\1


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2024/04/20      9:14        1166528 00.dds
-a----        2024/04/20      9:14         262272 01.dds
-a----        2024/04/20      9:14          16512 02.dds
```
- Each folder in a character represents a transform (Ordered by name)
- Each Transform should have 3 files that are DDS images named in order (Ordered by name)
- Must contain meta.json to generate the files

## Meta File
```json
{
	"id": 8001,
	"name": "Modernia",
	"sortName": "Modernia",
	"illustrator": {
		"id": 80000,
		"name": "SHIFT UP"
	},
	"works": {
		"id": 911,
		"name": "NIKKE"
	},
	"default": true,
	"transforms": [
	],
	"rewards": [
		{
			"id": 61190000,
			"type": 1,
			"name": "&#67;&#111;&#105;&#110;&#32;&#84;&#111;&#115;&#115;&#32;&#83;&#101;&#101;&#100;&#215;1",
			"levels": [3,5,7,10,12,15,20,25,30,40,50,60,70,80,90,100,150,200]
		}
	]
}
```

## How to use
1. Copy a Chara.xml and DDSImage.xml for templating
2. See exmaple workspace in input/
3. Run CCC.exe to compile
4. Files are outputted in output/

## Build
```powershell
pkg .
npx resedit --in .\build\chunicharactercreator.exe --out .\build\CCC_Build.exe --icon 1,..\sos-kirishima\icon.ico --no-grow --company-name "Academy City Research P.S.R." --file-description "Chunithm XML Compiler" --product-version 1.0.0.0 --product-name 'ChuniCharacterCreator'
```
