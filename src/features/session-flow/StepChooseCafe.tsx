import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Coffee, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessionFlowStore } from './store';

// Sample cafes - in a real app, this could come from a venues table
const SAMPLE_CAFES = [
  'Blue Bottle Coffee',
  'Starbucks',
  'Local Coffee Shop',
  'Philz Coffee',
  'Peet\'s Coffee',
  'Intelligentsia Coffee',
  'Counter Culture Coffee',
  'Ritual Coffee Roasters',
  'Four Barrel Coffee',
  'Sightglass Coffee',
];

export const StepChooseCafe = () => {
  const navigate = useNavigate();
  const { selectedCafe, setCafe } = useSessionFlowStore();
  const [open, setOpen] = useState(false);

  const handleNext = () => {
    if (selectedCafe) {
      navigate('/create-session/day');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Where would you like to work?
            </CardTitle>
            <p className="text-muted-foreground">
              Choose a café or workspace for your coworking session
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-12 text-left"
                >
                  {selectedCafe || "Select a café..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search cafés..." />
                  <CommandList>
                    <CommandEmpty>No café found.</CommandEmpty>
                    <CommandGroup>
                      {SAMPLE_CAFES.map((cafe) => (
                        <CommandItem
                          key={cafe}
                          value={cafe}
                          onSelect={() => {
                            setCafe(cafe);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCafe === cafe ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cafe}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button 
              onClick={handleNext}
              disabled={!selectedCafe}
              className="w-full h-12 text-base"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};