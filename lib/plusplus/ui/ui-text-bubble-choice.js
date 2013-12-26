ig.module(
        'plusplus.ui.ui-text-bubble-choice'
    )
    .requires(
        'plusplus.core.config',
        'plusplus.ui.ui-overlay',
        'plusplus.ui.ui-text',
        'plusplus.ui.ui-text-bubble',
        'plusplus.helpers.utilsvector2',
        'plusplus.helpers.utilsdraw',
        'plusplus.helpers.utilsintersection',
        'plusplus.ui.ui-button'
    )
    .defines(function () {
        "use strict";

        var _c = ig.CONFIG;

        /**
         * UI overlay to be used for displaying text and multiple responses in a decorative bubble.
         * <span class="alert alert-info"><strong>IMPORTANT:</strong>UI text box is an {@link ig.UIOverlay}, which means it creates an {@link ig.UIText} and uses {@link ig.UIOverlay#textSettings} to control the settings!</span>
         * @class
         * @extends ig.UIOverlay
         * @memberof ig
         * @author racingcow
         * @example
         * // see the UI overlay for a basic example of using overlays with text
         */
        ig.UITextBubbleChoice = ig.global.UITextBubbleChoice = ig.UITextBubble.extend(/**@lends ig.UITextBubble.prototype */{

            /**
             * @override
             * @default
             */
            size: {x: _c.TEXT_BUBBLE_CHOICE.SIZE_X, y: _c.TEXT_BUBBLE_CHOICE.SIZE_Y},

            sizeAsPct: false,

            /**
             * @override
             * @default
             */
            choiceSize: {x: _c.TEXT_BUBBLE_CHOICE.SIZE_X, y: _c.TEXT_BUBBLE_CHOICE.CHOICE_SIZE_Y},

            /**
             * Padding between message and top choice
             * @type Number
             * @default
             */
            choiceTopPaddingY: _c.TEXT_BUBBLE_CHOICE.CHOICE_TOP_PADDING_Y,

            /**
             * Padding between each choice
             * @type Number
             * @default
             */
            choicePaddingY: _c.TEXT_BUBBLE_CHOICE.CHOICE_PADDING_Y,

            /**
             * Text to show for response choices.
             * <br>- created on init
             * <br>- requires {@link ig.UIOverlay#textSettings}
             * @type Array
             * @private
             * @default
             */
            choiceMessages: null,

            /**
             * Buttons response choices.
             * <br>- created on init
             * <br>- requires {@link ig.UIOverlay#textSettings}
             * @type Array
             * @private
             * @default
             */
            choiceButtons: null,

            /**
             * Entity that indicates the currently highlighted choice
             * <br>- created on init
             * <br>- requires {@link ig.UIOverlay#textSettings}
             * @type ig.UIBorder
             * @private
             * @default
             */
            choiceIndictor: null,

            /**
             * @override
             */
            onChoiceActivated: null,

            init: function(x, y, settings) {

                this.parent(x, y, settings);

                this.message.refresh( true );
            },

            /**
             * @override
             **/
            initProperties: function () {

                this.parent();

                this.onChoiceActivated = new ig.Signal();

            },

            cleanup: function() {
                if ( this.choiceMessages && this.choiceMessages.length > 0 ) {
                    for (var i = 0, il = this.choiceMessages.length; i < il; i++) {
                        this.choiceButtons[i].onActivated.remove(this.choiceActivated);
                        this.choiceButtons[i].kill();
                        this.choiceMessages[i].kill();
                    }
                }
                this.textSettings.choices = [];
                this.parent();
            },

            choiceActivated: function(textButton) {
                var choiceMessage = textButton.choiceMessage;
                console.log('You clicked "' + choiceMessage.text + '" (' + choiceMessage.id + ')');
                this.onChoiceActivated.dispatch(choiceMessage.id);
            },

            /**
             * @override
             **/
            resetExtras: function () {

                if (!this.choiceMessages && this.textSettings && this.textSettings.choices && this.textSettings.choices.length > 0 ) {

                    this.choiceMessages = [];
                    this.choiceButtons = [];

                    var choice, choiceMessage, cScaleMod;
                    for (var i = 0, il = this.textSettings.choices.length; i < il; i++) {

                        choice = this.textSettings.choices[i];
                        choiceMessage = ig.game.spawnEntity( ig.UIText, 0, 0, {
                            layerName: this.layerName,
                            text: choice.text,
                            id: choice.id,
                            font: this.textSettings.choiceFont || ig.Font.FONTS.CHAT,
                            name: 'choiceMessage' + i.toString()
                        } );
                        this.choiceMessages.push(choiceMessage);

                        cScaleMod = choice.scale / this.scale;
                        var choiceButton = ig.game.spawnEntity( ig.UIButton, choiceMessage.pos.x, choiceMessage.pos.y, {
                            layerName: this.layerName,
                            fixed: this.fixed,
                            choiceMessage: choiceMessage,
                            name: 'choiceButton ' + i.toString()
                        } );
                        choiceButton.onActivated.add(this.choiceActivated, this);
                        this.choiceButtons.push(choiceButton);
                    }

                }

                this.parent();
            },

            /**
             * @override
             */
            resize: function ( force ) {

                var force = this.parent ( force );

                if ( this.message ) {

                    var scaleMod = this.message.scale / this.scale;
                    var sizeX = this.getSizeDrawX() - this.padding.x * 2;
                    var sizeY = this.getSizeDrawY() - this.padding.y * 2 - this.triangleLength;
                    var messageSizeX = this.message.getSizeDrawX() * scaleMod;
                    var messageSizeY = this.message.getSizeDrawY() * scaleMod;

                    if (this.choiceMessages) {

                        // message goes to top
                        messageSizeY = this.message.getSizeDrawY() * scaleMod;
                        ig.merge(this.textMoveToSettings, {
                           offsetPct: { x: 0, y: -1 },
                           offset: { x: 0, y: messageSizeY + this.padding.y }
                        });
                        this.message.moveTo( this, this.textMoveToSettings );

                        var choice, 
                            choiceSizeY = 0, choiceSizeX = 0, 
                            choiceOffset = 0, prevChoiceSizeY = 0,
                            choicesSizeY = 0, cScaleMod, bScaleMod, button;
                        for (var i = 0; i < this.choiceMessages.length; i++) {

                            choice = this.choiceMessages[i];
                            cScaleMod = choice.scale / this.scale;

                            // resize text / buttons to fit inside resized bubble

                            console.log('sizeX = ' + sizeX.toString());
                            console.log('size.x = ' + this.size.x.toString());
                            choice.maxWidth = sizeX * ( 1 / cScaleMod );
                            choice.resize( true );
                            choiceSizeX = choice.getSizeDrawX() * cScaleMod;

                            choice.maxHeight = sizeY * ( 1 / cScaleMod );
                            choice.resize( true );
                            choice.refresh( true );
                            choiceSizeY = choice.getSizeDrawY() * cScaleMod;

                            button = this.choiceButtons[i];
                            button.size = { x: choiceSizeX, y: choiceSizeY };
                            button.resize( true );
                            button.refresh( true );

                            // move choice / button to their correct positions

                            choiceOffset += prevChoiceSizeY;
                            if (i !== 0) {
                                choiceOffset += this.choicePaddingY;
                            }

                            // console.log('scale = ' + this.scale.toString());
                            // console.log('scaleMod = ' + scaleMod.toString());
                            // console.log('cScaleMod = ' + cScaleMod.toString());
                            // console.log('choice.scaleMod = ' + choice.scaleMod.toString());
                            console.log('choice[' + i.toString() + '].choiceSize = { x: ' + (choiceSizeX / cScaleMod).toString() + ', y: ' + (choiceSizeY / cScaleMod).toString() + ' }');
                            // console.log('choice[' + i.toString() + '].size = { x: ' + choice.size.x.toString() + ', y: ' + choice.size.y.toString() + ' }');
                            console.log('choice[' + i.toString() + '] is moving to { x: 0, y: ' + choiceOffset.toString() + ' }');
                            // console.log('choice font height = ' + (choice.font.heightForString(choice.textDisplay)).toString());
                            // console.log('scale of system scale = ' + choice.scaleOfSystemScale.toString());

                            choice.moveTo( this.message, {
                                matchPerformance: true,
                                offsetPct: { x: 0, y: 1 },
                                offset: { x: 0, y: this.choiceTopPaddingY + choiceOffset }
                            } );

                            choice.resize ( true );
                            choice.refresh( true );

                            // console.log('choice[' + i.toString() + '] new pos = { x: ' + choice.pos.x.toString() + ', y: ' + choice.pos.y.toString() + ' }');

                            button = this.choiceButtons[i];
                            bScaleMod = button.scale / this.scale;
                            button.size = { x: choiceSizeX / bScaleMod, y: choiceSizeY / bScaleMod };
                            button.moveTo( choice, { matchPerformance: true } );

                            prevChoiceSizeY = choiceSizeY / cScaleMod;

                            choicesSizeY += choiceSizeY;
                            if (i != 0) choicesSizeY += this.choicePaddingY;
                        }

                        // resize bubble to hold all choices
                        this.size.y = this.padding.y + messageSizeY + this.choiceTopPaddingY + choicesSizeY + this.padding.y + this.choiceTopPaddingY + this.triangleLength;

                    }

                }

                return force;

            }

        });

    });