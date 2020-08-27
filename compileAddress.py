
try:
	from PIL import Image
except ImportError:
	import Image
import pytesseract as pt
import tkinter as tk
import pyscreenshot as ImageGrab
from datetime import datetime
import os

CWD = os.getcwd()
ADDRESS_BAR_POSITION = (3918, 994, 4053, 1053)
pt.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class ScreenshotParser():
	def __init__(self):
		pass

	def get_address_screenshot(self):
		img = ImageGrab.grab(bbox=ADDRESS_BAR_POSITION)
		img.save(f'{CWD}\\imgs\\tmp.png')

	def parse_image(self):
		raw_text = pt.image_to_string(Image.open(f'{CWD}\\imgs\\tmp.png'))
		first_line = raw_text.split("\n")[0]
		address_number = first_line.split(" ")[0]
		street_name = " ".join(first_line.split(" ")[1:])

		number = ""
		for char in address_number:
			try:
				int(char)
				number += char
			except:
				pass

		return {'num':number, 'street':street_name}

	def trigger(self):
		self.get_address_screenshot()
		data = self.parse_image()
		return data

class UIApp():
	def __init__(self):
		self.root = tk.Tk()
		self.root.geometry('150x150+4200+100')
		self.root.wm_attributes("-topmost", 1)
		self.root.bind("<Key>",self.key_press)
		self.root.bind("<Button-3>",self.mouse_press)
		self.create_elements()
		self.parser = ScreenshotParser()
		self.writer = BlobWriter()

		self.mainloop()

	def create_elements(self):
		self.check_vars = {
			'rear': tk.IntVar(),
			'front': tk.IntVar(),
			'north': tk.IntVar(),
			'south': tk.IntVar(),
			'west': tk.IntVar(),
			'east': tk.IntVar(),
		}

		tk.Checkbutton(self.root, text="REAR EASEMENT", variable=self.check_vars['rear']).grid(row=0, column=0, sticky="W")
		tk.Checkbutton(self.root, text="FRONT EASEMENT", variable=self.check_vars['front']).grid(row=1, column=0, sticky="W")
		tk.Checkbutton(self.root, text="NORTHERN SIDE", variable=self.check_vars['north']).grid(row=2, column=0, sticky="W")
		tk.Checkbutton(self.root, text="SOUTHERN SIDE", variable=self.check_vars['south']).grid(row=3, column=0, sticky="W")
		tk.Checkbutton(self.root, text="WESTERN SIDE", variable=self.check_vars['west']).grid(row=4, column=0, sticky="W")
		tk.Checkbutton(self.root, text="EASTERN SIDE", variable=self.check_vars['east']).grid(row=5, column=0, sticky="W")

	def key_press(self, event):
		if event.char == "f":
			self.trigger_event()
		elif event.char == "q":
			self.root.destroy()

	def mouse_press(self, event):
		self.trigger_event()

	def trigger_event(self):
		selected_options = {}
		count = 0
		for option in self.check_vars:
			val = self.check_vars[option].get()
			if val == 1:
				count += 1
			selected_options[option] = val
		if count == 0:
			return
		screen_text = self.parser.trigger()
		self.writer.append_to_file(selected_options, screen_text)

	def mainloop(self):
		while True:
			try:
				self.root.update()
			except:
				print('goodbye')
				break


class BlobWriter():
	def __init__(self):
		self.create_file()

	def create_file(self):
		date = datetime.today()
		date_string = f'{date.month}-{date.day} {str(date.hour).zfill(2)}{str(date.minute).zfill(2)}{str(date.second).zfill(2)}'
		self.file_path = f'{CWD}\\blobs\\blobs {date_string}.txt'
		with open(self.file_path,'w+') as f:
			self.append_to_file()
		

	def append_to_file(self, options="init", screen_text=None):
		with open(self.file_path, 'a+') as f:
			if options == "init":
				f.write("BLOB FILE INITIALIZED\n")
			else:
				f.write(f'{screen_text} {options}\n')


app = UIApp()