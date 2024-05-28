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
	"sort": "Modernia",
	"illustrator": {
		"id": 80000,
		"name": "SHIFT UP"
	},
    "flat": false,
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
Flat Setting is when you want to keep all images in the folder and do not want a folder per transform, Files must be ##.dds/png where the first number is 0-9 and is the transform and 0-2 is the image index

You can also add a chara.xml in the folder to override the base template

## How to use
1. Copy a Chara.xml and DDSImage.xml for templating
2. See exmaple workspace in input/
3. Run CCC.exe to compile
4. Files are outputted in output/

## Decompiler
You can use the decompiler to extract charas into a workspace structure
### Folder Structure
```powersell


    Directory: \ChuniCharacterCreator


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        2024/05/26      8:21                import
-a----        2024/05/26      8:20       38764782 CCC_Build.exe
-a----        2024/05/26     19:45       35908949 CCC_Decompiler.exe


    Directory: \ChuniCharacterCreator\import\AZM1


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        2024/05/26     17:24                chara
d-----        2024/05/26     18:12                ddsImage
-a----        2024/05/26     19:15             90 config.json
```
### Config File
You can add a config.json inside the workspace directory, Items in here are used to overwrite the extracted data.

The ID Number is the new starting ID and will be added incrementally
```json
{
  "id": 9800,
  "works": {
    "id": 9854,
    "name": "KAZARI"
  },
  "default": true
}
```
### How to use
1. Copy a Chara.xml and DDSImage.xml for templating
2. Copy the chara and ddsImage folders from the option pack you made or from the dataset to a workspace folder
3. Add a config.json if needed
4. Run CCC_Decompiler.exe to compile
5. Files are outputted in extracted/

## Build
```powershell
pkg .
npx resedit --in .\build\chunicharactercreator.exe --out .\build\CCC_Build.exe --icon 1,..\sos-kirishima\icon.ico --no-grow --company-name "Academy City Research P.S.R." --file-description "Chunithm XML Compiler" --product-version 1.0.0.0 --product-name 'ChuniCharacterCreator'
pkg --compress GZip .\decompile.js --target node16-win-x64 --output .\build\decompiler.exe
npx resedit --in .\build\decompiler.exe --out .\build\CCC_Decompiler.exe --icon 1,..\sos-kirishima\icon.ico --no-grow --company-name "Academy City Research P.S.R." --file-description "Chunithm XML Decompiler" --product-version 1.0.0.0 --product-name 'ChuniCharacterCreator'
pkg --compress GZip .\mitigate.js --target node16-win-x64 --output .\build\migrate.exe
npx resedit --in .\build\migrate.exe --out .\build\CCC_Migrate.exe --icon 1,..\sos-kirishima\icon.ico --no-grow --company-name "Academy City Research P.S.R." --file-description "Chunithm XML Decompiler" --product-version 1.0.0.0 --product-name 'ChuniCharacterCreator'
```
