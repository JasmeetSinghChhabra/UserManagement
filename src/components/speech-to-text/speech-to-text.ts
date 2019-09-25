import { Component, ViewChild, ElementRef, Renderer, EventEmitter, Input, Output } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { AppService } from '../../services/services';

@Component({
  selector: 'speech-to-text',
  templateUrl: 'speech-to-text.html'
})
export class SpeechToTextComponent {

  @Output() onSpeechMatch = new EventEmitter<string>();
  @Input() recordingText: string;
  @Input() waitingText: string;
  @Input() buttonType: string = 'full';
  @Input() input: any;
  buttonText: string = '';
  recording: boolean = false;

  constructor(private renderer: Renderer, private elementRef: ElementRef, private app: AppService, private speechRecognition: SpeechRecognition) {

  }

  ngOnInit(): void {
    if (this.recordingText == null) {
      this.recordingText = 'Stop speech to text';
    }
    if (this.waitingText == null) {
      this.waitingText = 'Start speech to text';      
    }
    this.buttonText = this.waitingText;
  }

  ngAfterViewInit(): void {
  }

  recordSpeech() {

    if (this.buttonType === 'input' && this.input == undefined) {
      this.app.showErrorToast("Speech to text is missing input control reference");
      return;
    }

    if (!this.app.isApp()) return;

    if (!this.speechRecognition) {
      this.app.showErrorToast("Speech recognition component cannot be created");
    }

    let options = {
      language: "en-US",
      matches: 1,
      prompt: "",
      showPopup: true,
      showPartial: false
    }

    // Check permission
    this.speechRecognition.hasPermission()
      .then((hasPermission: boolean) => {
        if (hasPermission) {
          // Check feature available
          this.speechRecognition.isRecognitionAvailable()
            .then((available: boolean) => {
              if (available) {
                if (!this.recording) {
                  // Start the recognition process
                  this.recording = true;
                  this.buttonText = this.recordingText;
                  this.speechRecognition.startListening(options).subscribe(
                    (matches: Array<string>) => {
                      //console.log(matches);
                      let match = matches[0];
                      this.onSpeechMatch.emit(match);
                      this.recording = false;
                      this.buttonText = this.waitingText;
                      if (this.buttonType === 'input') {
                        if (this.input.value === '') {
                          this.input.value = this.input.value + match;
                        } else {
                          this.input.value = this.input.value + ', ' + match;
                        }
                      }
                    },
                    (error) => {
                      console.log('error:', error);
                      if (error !== '0') {
                        this.app.showErrorToast(`Error on speech recognition: speech not detected.`);
                      }
                      this.recording = false;
                      this.buttonText = this.waitingText;
                    });
                } else {
                  this.speechRecognition.stopListening();
                  this.recording = false;
                  this.buttonText = this.waitingText;
                }
              } else {
                this.app.showErrorToast("Speech recognition is not available");
              }
            });
        } else {
          this.app.showErrorToast("Speech recognition does not have permissions");
          // Request permissions
          this.speechRecognition.requestPermission()
            .then(
            () => this.app.showSuccessToast("Speech recognition persmissions granted"),
            () => this.app.showErrorToast("Speech recognition persmissions denied")
            );
        }
      });
  }

  recordingColor() {
    if (this.recording) {
      return "danger";
    } else {
      return "light";
    }
  }
}
