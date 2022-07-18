import { CONST } from '../const/const';
import { Tile } from '../objects/tile';

export class GameScene extends Phaser.Scene {
    // Variables
    private canMove: boolean;

    // Grid with tiles
    private tileGrid: Tile[][];

    // Selected Tiles
    private firstSelectedTile: Tile;
    private secondSelectedTile: Tile;
    tweenTile: Phaser.Tweens.Tween;

    private changingTile: boolean = false;
    constructor() {
        super({
        key: 'GameScene'
        });
    }

    init(): void {
        // Init variables
        this.canMove = true;

        // set background color
        this.cameras.main.setBackgroundColor(0x78aade);

        // Init grid with tiles
        this.tileGrid = [];
        for (let y = 0; y < CONST.gridHeight; y++) {
        this.tileGrid[y] = [];
        for (let x = 0; x < CONST.gridWidth; x++) {
            this.tileGrid[y][x] = this.addTile(x, y);
        }
        }

        // Selected Tiles
        this.firstSelectedTile = undefined;
        this.secondSelectedTile = undefined;

        // Input
        this.input.on('gameobjectdown', this.tileDown, this);

        // Check if matches on the start
        this.checkMatches();

        this.time.addEvent({
            delay: 5000,                // ms
            callback: this.handleAnimsLoop,
            //args: [],
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Add a new random tile at the specified position.
     * @param x
     * @param y
     */
    private addTile(x: number, y: number): Tile {
        // Get a random tile
        let randomTileType: string =
        CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]; ///test

        // Return the created tile
        return new Tile({
        scene: this,
        x: x * CONST.tileWidth,
        y: y * CONST.tileHeight,
        texture: randomTileType
        });
    }

    /**
     * This function gets called, as soon as a tile has been pressed or clicked.
     * It will check, if a move can be done at first.
     * Then it will check if a tile was already selected before or not (if -> else)
     * @param pointer
     * @param gameobject
     * @param event
     */
    private tileDown(pointer: any, gameobject: any, event: any): void {
        if (this.canMove) {
        if (!this.firstSelectedTile) {
            this.firstSelectedTile = gameobject;
            gameobject.setAlpha(0)
            this.tweenTile = this.tweens.add({
                targets: gameobject,
                alpha: 1,
                ease: 'Power0',
                duration: 500,
                yoyo: true,
                repeat: -1
            })
        } else {
            // So if we are here, we must have selected a second tile
            this.tweenTile.stop();
            this.firstSelectedTile.setAlpha(1);
            this.secondSelectedTile = gameobject;

            let dx =
            Math.abs(this.firstSelectedTile.x - this.secondSelectedTile.x) /
            CONST.tileWidth;
            let dy =
            Math.abs(this.firstSelectedTile.y - this.secondSelectedTile.y) /
            CONST.tileHeight;

            // Check if the selected tiles are both in range to make a move
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            this.canMove = false;
            this.swapTiles();
            }
            else {
                this.tileUp()
            }
        }
        }
    }

    /**
     * This function will take care of the swapping of the two selected tiles.
     * It will only work, if two tiles have been selected.
     */
    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
        // Get the position of the two tiles
        let firstTilePosition = {
            x: this.firstSelectedTile.x,
            y: this.firstSelectedTile.y
        };

        let secondTilePosition = {
            x: this.secondSelectedTile.x,
            y: this.secondSelectedTile.y
        };

        // Swap them in our grid with the tiles
        this.tileGrid[firstTilePosition.y / CONST.tileHeight][
            firstTilePosition.x / CONST.tileWidth
        ] = this.secondSelectedTile;
        this.tileGrid[secondTilePosition.y / CONST.tileHeight][
            secondTilePosition.x / CONST.tileWidth
        ] = this.firstSelectedTile;

        // Move them on the screen with tweens
        this.add.tween({
            targets: this.firstSelectedTile,
            x: this.secondSelectedTile.x,
            y: this.secondSelectedTile.y,
            ease: 'Linear',
            duration: 400,
            repeat: 0,
            yoyo: false
        });

        this.add.tween({
            targets: this.secondSelectedTile,
            x: this.firstSelectedTile.x,
            y: this.firstSelectedTile.y,
            ease: 'Linear',
            duration: 400,
            repeat: 0,
            yoyo: false,
            onComplete: () => {
            this.checkMatches();
            }
        });
    
        if (this.firstSelectedTile.y === this.secondSelectedTile.y) {
            this.add.tween({
                targets: this.firstSelectedTile,
                y: '-= 50',
                ease: 'Linear',
                duration: 200,
                yoyo: true
            });
            
            this.add.tween({
                targets: this.secondSelectedTile,
                y: '+= 50',
                ease: 'Linear',
                duration: 200,
                yoyo: true
            });
        } else {
            this.add.tween({
                targets: this.firstSelectedTile,
                x: '-= 50',
                ease: 'Linear',
                duration: 200,
                yoyo: true
            });
            
            this.add.tween({
                targets: this.secondSelectedTile,
                x: '+= 50',
                ease: 'Linear',
                duration: 200,
                yoyo: true
            });
        }

        this.firstSelectedTile = this.tileGrid[
            firstTilePosition.y / CONST.tileHeight
        ][firstTilePosition.x / CONST.tileWidth];
        this.secondSelectedTile = this.tileGrid[
            secondTilePosition.y / CONST.tileHeight
        ][secondTilePosition.x / CONST.tileWidth];
        }
    }

    private checkMatches(): void {
        this.changingTile = true;
        //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row
        let matches = this.getMatches(this.tileGrid);

        //If there are matches, remove them
        if (matches.length > 0) {
        //Remove the tiles
        this.removeTileGroup(matches);
        // Move the tiles currently on the board into their new positions
        // this.resetTile();
        //Fill the board with new tiles wherever there is an empty spot
        // this.fillTile();
        // this.tileUp();
        // this.checkMatches();
        } else {
        // No match so just swap the tiles back to their original position and reset
        this.swapTiles();
        this.tileUp();
        this.canMove = true;
        }
        this.changingTile = false;
    }

    private resetTile(): void {
        // Loop through each column starting from the left
        for (let y = this.tileGrid.length - 1; y > 0; y--) {
        // Loop through each tile in column from bottom to top
        for (let x = this.tileGrid[y].length - 1; x >= 0; x--) {
            // If this space is blank, but the one above it is not, move the one above down
            if (
            this.tileGrid[y][x] === undefined &&
            this.tileGrid[y - 1][x] !== undefined
            ) {
            // Move the tile above down one
            let tempTile = this.tileGrid[y - 1][x];
            this.tileGrid[y][x] = tempTile;
            this.tileGrid[y - 1][x] = undefined;

            this.add.tween({
                targets: tempTile,
                y: CONST.tileHeight * y,
                ease: 'Linear',
                duration: 200,
                repeat: 0,
                yoyo: false
            });

            this.time.delayedCall(200, () => {
                this.add.tween({
                    targets: tempTile,
                    y: '-=20',
                    ease: 'Linear',
                    duration: 100,
                    repeat: 0,
                    yoyo: true
                });
            })

            //The positions have changed so start this process again from the bottom
            //NOTE: This is not set to me.tileGrid[i].length - 1 because it will immediately be decremented as
            //we are at the end of the loop.
            x = this.tileGrid[y].length;
            }
        }
        }
    }

    private fillTile(): void {
        //Check for blank spaces in the grid and add new tiles at that position
        for (var y = 0; y < this.tileGrid.length; y++) {
        for (var x = 0; x < this.tileGrid[y].length; x++) {
            if (this.tileGrid[y][x] === undefined) {
                //Found a blank spot so lets add animate a tile there
                let tile = this.addTile(x, y);

                tile.setAlpha(0);
                this.tweens.add({
                    targets: tile,
                    alpha: 1,
                    duration: 500, 
                })

                //And also update our "theoretical" grid
                this.tileGrid[y][x] = tile;
            }
        }
        }
    }

    private handleAnimsLoop() {
        if (!this.canMove || this.firstSelectedTile !== undefined) return
        var i = 0;
        for (let y = 0; y < this.tileGrid.length ; y++) {
            // Loop through each tile in column from bottom to top
            for (let x = 0; x < this.tileGrid[y].length ; x++) {
                    let tile = this.tileGrid[y][x];
                    this.tweens.add({
                        targets: tile,
                        scale: 1.2,
                        x: '-=15',
                        y: '-=15',
                        ease: 'Sine.easeInOut',
                        duration: 300,
                        delay: i * 50,
                        yoyo: true
                    });

                    i++;
                    
                    if (i % 8 === 0) i=0;
            }
        }
    }

    private tileUp(): void {
        // Reset active tiles
        this.firstSelectedTile = undefined;
        this.secondSelectedTile = undefined;
    }

    private removeTileGroup(matches: any): void {
        // Loop through all the matches and remove the associated tiles
        for (var i = 0; i < matches.length; i++) {
            var tempArr = matches[i];

            for (var j = 0; j < tempArr.length; j++) {
                let tile = tempArr[j];
                //Find where this tile lives in the theoretical grid
                let tilePos = this.getTilePos(this.tileGrid, tile);

                // Remove the tile from the theoretical grid
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    this.createExplosion(tempArr, 0, tempArr.length)
                    // this.time.delayedCall(1500, ()=>{
                    //     this.tileGrid[tilePos.y][tilePos.x] = undefined;
                    // });
                    
                }
            }
        }
    }
    createExplosion(_arr: any, _idx: number, _maxIdx: number) {
        if (_idx === _maxIdx) {
            for (var j = 0; j < _arr.length; j++) {
                let tile = _arr[j];
                let tilePos = this.getTilePos(this.tileGrid, tile);
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    this.tileGrid[tilePos.y][tilePos.x] = undefined;
                }
            }
            this.resetTile();
            this.time.delayedCall(500, ()=>{
                this.fillTile();
                this.tileUp();
                this.checkMatches();
            });
            // this.fillTile();
            // this.tileUp();
            // this.checkMatches();
            return;
        }
        let tile = _arr[_idx]
        var particles = this.add.particles('flares');
        var emitter = particles.createEmitter({
            frame: [ 'red', 'blue', 'green', 'yellow' ],
            x: tile.x+30,
            y: tile.y+40,
            speed: 200,
            lifespan: 500,
            blendMode: 'ADD',
            scale: 0.2
        });

        this.tweens.add({
            targets: tile,
            scale: 1.5,
            x: '-=15',
            y: '-=15',
            ease: 'Sine.easeInOut',
            duration: 500
        })

        this.time.delayedCall(500, ()=>{
            emitter.stop();
            // let tilePos = this.getTilePos(this.tileGrid, tile);
            // this.tileGrid[tilePos.y][tilePos.x] = undefined;
            tile.destroy()
            this.createExplosion(_arr, _idx+1, _maxIdx)
        });
    }

    private getTilePos(tileGrid: Tile[][], tile: Tile): any {
        let pos = { x: -1, y: -1 };

        //Find the position of a specific tile in the grid
        for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            //There is a match at this position so return the grid coords
            if (tile === tileGrid[y][x]) {
            pos.x = x;
            pos.y = y;
            break;
            }
        }
        }

        return pos;
    }

    private getMatches(tileGrid: Tile[][]): Tile[][] {
        let matches: Tile[][] = [];
        let groups: Tile[] = [];

        // Check for horizontal matches
        for (let y = 0; y < tileGrid.length; y++) {
        let tempArray = tileGrid[y];
        groups = [];
        for (let x = 0; x < tempArray.length; x++) {
            if (x < tempArray.length - 2) {
            if (tileGrid[y][x] && tileGrid[y][x + 1] && tileGrid[y][x + 2]) {
                if (
                tileGrid[y][x].texture.key === tileGrid[y][x + 1].texture.key &&
                tileGrid[y][x + 1].texture.key === tileGrid[y][x + 2].texture.key
                ) {
                if (groups.length > 0) {
                    if (groups.indexOf(tileGrid[y][x]) == -1) {
                    matches.push(groups);
                    groups = [];
                    }
                }

                if (groups.indexOf(tileGrid[y][x]) == -1) {
                    groups.push(tileGrid[y][x]);
                }

                if (groups.indexOf(tileGrid[y][x + 1]) == -1) {
                    groups.push(tileGrid[y][x + 1]);
                }

                if (groups.indexOf(tileGrid[y][x + 2]) == -1) {
                    groups.push(tileGrid[y][x + 2]);
                }
                }
            }
            }
        }

        if (groups.length > 0) {
            matches.push(groups);
        }
        }

        //Check for vertical matches
        for (let j = 0; j < tileGrid.length; j++) {
        var tempArr = tileGrid[j];
        groups = [];
        for (let i = 0; i < tempArr.length; i++) {
            if (i < tempArr.length - 2)
            if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
                if (
                tileGrid[i][j].texture.key === tileGrid[i + 1][j].texture.key &&
                tileGrid[i + 1][j].texture.key === tileGrid[i + 2][j].texture.key
                ) {
                if (groups.length > 0) {
                    if (groups.indexOf(tileGrid[i][j]) == -1) {
                    matches.push(groups);
                    groups = [];
                    }
                }

                if (groups.indexOf(tileGrid[i][j]) == -1) {
                    groups.push(tileGrid[i][j]);
                }
                if (groups.indexOf(tileGrid[i + 1][j]) == -1) {
                    groups.push(tileGrid[i + 1][j]);
                }
                if (groups.indexOf(tileGrid[i + 2][j]) == -1) {
                    groups.push(tileGrid[i + 2][j]);
                }
                }
            }
        }
        if (groups.length > 0) matches.push(groups);
        }

        return matches;
    }
}

